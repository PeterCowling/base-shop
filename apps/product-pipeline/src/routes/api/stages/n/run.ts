/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/n/run.ts

import type { PipelineEventContext } from "../../_lib/types";
import { z } from "zod";
import { isCooldownActive } from "@/lib/pipeline/cooldown";
import {
  fetchCandidateById,
  fetchLatestCooldownByFingerprint,
  getDb,
  nowIso,
  type PipelineEnv,
} from "../../_lib/db";
import { checkStageTSGate } from "../../_lib/stage-gating";
import { errorResponse, jsonResponse } from "../../_lib/response";

const statusSchema = z.enum([
  "not_started",
  "in_progress",
  "waiting_on_supplier",
  "terms_improved",
  "no_progress",
]);

const centsSchema = z.number().int().min(0);

const bodySchema = z.object({
  candidateId: z.string().min(1),
  status: statusSchema,
  supplierName: z.string().min(1).optional(),
  targetUnitCostCents: centsSchema.optional(),
  targetMoq: z.number().int().min(0).optional(),
  targetLeadTimeDays: z.number().int().min(0).max(3650).optional(),
  targetDepositPct: z.number().min(0).max(100).optional(),
  targetPaymentTerms: z.string().min(1).optional(),
  targetIncoterms: z.string().min(1).optional(),
  tasks: z.array(z.string().min(1)).optional(),
  notes: z.string().min(1).optional(),
  requestedBy: z.string().min(1).optional(),
  inputVersion: z.string().min(1).optional(),
});

type StageNOutputSummary = {
  status: z.infer<typeof statusSchema>;
  supplierName: string | null;
  targetUnitCostCents: string | null;
  targetMoq: number | null;
  targetLeadTimeDays: number | null;
  targetDepositPct: number | null;
  targetPaymentTerms: string | null;
  targetIncoterms: string | null;
  tasks: string[] | null;
};

type StageNOutput = {
  engineVersion: string;
  summary: StageNOutputSummary;
  notes: string | null;
};

const ENGINE_VERSION = "stage-n:v1";

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
    status,
    supplierName,
    targetUnitCostCents,
    targetMoq,
    targetLeadTimeDays,
    targetDepositPct,
    targetPaymentTerms,
    targetIncoterms,
    tasks,
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

  const summary: StageNOutputSummary = {
    status,
    supplierName: supplierName ?? null,
    targetUnitCostCents: toString(targetUnitCostCents),
    targetMoq: targetMoq ?? null,
    targetLeadTimeDays: targetLeadTimeDays ?? null,
    targetDepositPct: targetDepositPct ?? null,
    targetPaymentTerms: targetPaymentTerms ?? null,
    targetIncoterms: targetIncoterms ?? null,
    tasks: tasks ?? null,
  };

  const inputPayload = {
    input: {
      status,
      ...(supplierName ? { supplierName } : {}),
      ...(targetUnitCostCents !== undefined ? { targetUnitCostCents } : {}),
      ...(targetMoq !== undefined ? { targetMoq } : {}),
      ...(targetLeadTimeDays !== undefined ? { targetLeadTimeDays } : {}),
      ...(targetDepositPct !== undefined ? { targetDepositPct } : {}),
      ...(targetPaymentTerms ? { targetPaymentTerms } : {}),
      ...(targetIncoterms ? { targetIncoterms } : {}),
      ...(tasks ? { tasks } : {}),
      ...(notes ? { notes } : {}),
    },
    inputVersion: inputVersion ?? "v1",
    ...(requestedBy ? { requestedBy } : {}),
  };

  const output: StageNOutput = {
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
        "N",
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
      .bind("N_DONE", now, candidateId),
  ]);

  return jsonResponse({ ok: true, candidateId, summary });
};
