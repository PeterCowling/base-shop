/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/t/run.ts

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
import type { PipelineEventContext } from "../../_lib/types";

const decisionSchema = z.enum(["allowed", "needs_review", "blocked"]);

const bodySchema = z.object({
  candidateId: z.string().min(1),
  decision: decisionSchema,
  reasonCodes: z.array(z.string().min(1)).optional(),
  requiredEvidence: z.array(z.string().min(1)).optional(),
  notes: z.string().min(1).optional(),
  requestedBy: z.string().min(1).optional(),
  inputVersion: z.string().min(1).optional(),
});

type StageTDecision = z.infer<typeof decisionSchema>;

type StageTOutputSummary = {
  decision: StageTDecision;
  action: "ADVANCE" | "REVIEW" | "BLOCK";
  requiredEvidenceCount: number;
  reasonCodes: string[];
};

type StageTOutput = {
  engineVersion: string;
  summary: StageTOutputSummary;
  reasons: string[];
  requiredEvidence: string[];
  notes: string | null;
};

const ENGINE_VERSION = "stage-t:v1";

function resolveAction(decision: StageTDecision): StageTOutputSummary["action"] {
  if (decision === "blocked") return "BLOCK";
  if (decision === "needs_review") return "REVIEW";
  return "ADVANCE";
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
    decision,
    reasonCodes,
    requiredEvidence,
    notes,
    requestedBy,
    inputVersion,
  } = parsed.data;

  const db = getDb(env);
  const candidate = await fetchCandidateById(db, candidateId);
  if (!candidate) {
    return errorResponse(404, "candidate_not_found", { candidateId });
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

  const reasons = reasonCodes ?? [];
  const evidence = requiredEvidence ?? [];
  const summary: StageTOutputSummary = {
    decision,
    action: resolveAction(decision),
    requiredEvidenceCount: evidence.length,
    reasonCodes: reasons,
  };

  const inputPayload = {
    input: {
      decision,
      ...(reasons.length > 0 ? { reasonCodes: reasons } : {}),
      ...(evidence.length > 0 ? { requiredEvidence: evidence } : {}),
      ...(notes ? { notes } : {}),
    },
    inputVersion: inputVersion ?? "v1",
    ...(requestedBy ? { requestedBy } : {}),
  };

  const output: StageTOutput = {
    engineVersion: ENGINE_VERSION,
    summary,
    reasons,
    requiredEvidence: evidence,
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
        "T",
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
      .bind("T_DONE", now, candidateId),
  ]);

  return jsonResponse({ ok: true, candidateId, summary });
};
