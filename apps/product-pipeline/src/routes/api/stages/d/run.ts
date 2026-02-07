/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/d/run.ts

import { z } from "zod";

import { isCooldownActive } from "@/lib/pipeline/cooldown";

import {
  fetchCandidateById,
  fetchLatestCooldownByFingerprint,
  getDb,
  nowIso,
  type PipelineEnv,
} from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";
import { checkStageTSGate } from "../../_lib/stage-gating";
import type { PipelineEventContext } from "../../_lib/types";

const readinessSchema = z.enum(["not_started", "in_progress", "ready"]);
const centsSchema = z.number().int().min(0);

const bodySchema = z.object({
  candidateId: z.string().min(1),
  assetReadiness: readinessSchema,
  oneTimeCostCents: centsSchema.optional(),
  samplingRounds: z.number().int().min(0).max(25).optional(),
  leadTimeDays: z.number().int().min(0).max(3650).optional(),
  packagingStatus: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
  requestedBy: z.string().min(1).optional(),
  inputVersion: z.string().min(1).optional(),
});

type StageDOutputSummary = {
  assetReadiness: z.infer<typeof readinessSchema>;
  oneTimeCostCents: string | null;
  samplingRounds: number | null;
  leadTimeDays: number | null;
  packagingStatus: string | null;
};

type StageDOutput = {
  engineVersion: string;
  summary: StageDOutputSummary;
  notes: string | null;
};

const ENGINE_VERSION = "stage-d:v1";

function toString(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

export const onRequestPost = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const {
    candidateId,
    assetReadiness,
    oneTimeCostCents,
    samplingRounds,
    leadTimeDays,
    packagingStatus,
    notes,
    requestedBy,
    inputVersion,
  } = parsed.data;

  const db = getDb(env);
  const candidate = await fetchCandidateById(db, candidateId);
  if (!candidate) {
    return errorResponse(404, "candidate_not_found", { candidateId });
  }

  const stageGate = await checkStageTSGate(db, candidateId);
  if (stageGate) {
    return errorResponse(409, stageGate.code, stageGate.details);
  }

  if (candidate.fingerprint) {
    const cooldown = await fetchLatestCooldownByFingerprint(
      db,
      candidate.fingerprint,
    );
    if (cooldown && isCooldownActive(cooldown.severity, cooldown.recheck_after)) {
      return errorResponse(409, "cooldown_active", {
        fingerprint: cooldown.fingerprint,
        reasonCode: cooldown.reason_code,
        severity: cooldown.severity,
        recheckAfter: cooldown.recheck_after,
        whatWouldChange: cooldown.what_would_change,
      });
    }
  }

  const summary: StageDOutputSummary = {
    assetReadiness,
    oneTimeCostCents: toString(oneTimeCostCents),
    samplingRounds: samplingRounds ?? null,
    leadTimeDays: leadTimeDays ?? null,
    packagingStatus: packagingStatus ?? null,
  };

  const inputPayload = {
    input: {
      assetReadiness,
      ...(oneTimeCostCents !== undefined ? { oneTimeCostCents } : {}),
      ...(samplingRounds !== undefined ? { samplingRounds } : {}),
      ...(leadTimeDays !== undefined ? { leadTimeDays } : {}),
      ...(packagingStatus ? { packagingStatus } : {}),
      ...(notes ? { notes } : {}),
    },
    inputVersion: inputVersion ?? "v1",
    ...(requestedBy ? { requestedBy } : {}),
  };

  const output: StageDOutput = {
    engineVersion: ENGINE_VERSION,
    summary,
    notes: notes ?? null,
  };

  const now = nowIso();
  await db.batch([
    db
      .prepare(
        "INSERT INTO stage_runs (id, candidate_id, stage, status, input_version, input_json, output_json, error_json, started_at, finished_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        crypto.randomUUID(),
        candidateId,
        "D",
        "succeeded",
        inputVersion ?? "v1",
        JSON.stringify(inputPayload),
        JSON.stringify(output),
        null,
        now,
        now,
        now,
      ),
    db
      .prepare("UPDATE candidates SET stage_status = ?, updated_at = ? WHERE id = ?")
      .bind("D_DONE", now, candidateId),
  ]);

  return jsonResponse({ ok: true, candidateId, summary });
};
