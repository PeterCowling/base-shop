/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/b/run.ts

import type { PipelineEventContext } from "../../_lib/types";
import { z } from "zod";
import { isCooldownActive } from "@/lib/pipeline/cooldown";
import { computeStageBOutput } from "@/lib/pipeline/stage-b";
import {
  fetchCandidateById,
  fetchLatestCooldownByFingerprint,
  getDb,
  nowIso,
  type PipelineEnv,
} from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";

const centsSchema = z.number().int().min(0);

const laneMetaSchema = z
  .object({
    laneId: z.string().min(1).nullable().optional(),
    laneName: z.string().min(1).nullable().optional(),
    laneModel: z.string().min(1).nullable().optional(),
    laneIncoterm: z.string().min(1).nullable().optional(),
    laneVersionId: z.string().min(1).nullable().optional(),
    laneVersionLabel: z.string().min(1).nullable().optional(),
    laneStatus: z.string().min(1).nullable().optional(),
    laneConfidence: z.string().min(1).nullable().optional(),
    laneExpiresAt: z.string().min(1).nullable().optional(),
    laneCurrency: z.string().min(1).nullable().optional(),
    laneSourceCurrency: z.string().min(1).nullable().optional(),
    laneFxRate: z.number().nullable().optional(),
    laneFxDate: z.string().min(1).nullable().optional(),
    laneFxSource: z.string().min(1).nullable().optional(),
    laneLeadTimeBaseDays: z.number().int().min(0).nullable().optional(),
    laneCostBasis: z.string().min(1).nullable().optional(),
    laneCostAmount: z.number().min(0).nullable().optional(),
  })
  .optional();

const bodySchema = z.object({
  candidateId: z.string().min(1),
  unitsPlanned: z.number().int().positive(),
  unitCostCents: centsSchema,
  freightCents: centsSchema.optional(),
  dutyCents: centsSchema.optional(),
  vatCents: centsSchema.optional(),
  packagingCents: centsSchema.optional(),
  inspectionCents: centsSchema.optional(),
  otherCents: centsSchema.optional(),
  leadTimeDays: z.number().int().min(0).max(3650).optional(),
  depositPct: z.number().min(0).max(100).optional(),
  balanceDueDays: z.number().int().min(0).max(3650).optional(),
  incoterms: z.string().min(1).optional(),
  lane: laneMetaSchema,
  notes: z.string().min(1).optional(),
  requestedBy: z.string().min(1).optional(),
  inputVersion: z.string().min(1).optional(),
});

type StageBOutputSummary = {
  perUnitLandedCostCents: string;
  totalLandedCostCents: string;
  depositPct: number | null;
  depositAmountCents: string | null;
  balanceAmountCents: string | null;
  leadTimeDays: number | null;
  balanceDueDays: number | null;
  balanceDueDay: number | null;
};

type StageBOutput = {
  engineVersion: string;
  summary: StageBOutputSummary;
  breakdown: {
    unitCostCents: string;
    freightCents: string;
    dutyCents: string;
    vatCents: string;
    packagingCents: string;
    inspectionCents: string;
    otherCents: string;
  };
  notes: string | null;
};

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
    unitsPlanned,
    unitCostCents,
    freightCents,
    dutyCents,
    vatCents,
    packagingCents,
    inspectionCents,
    otherCents,
    leadTimeDays,
    depositPct,
    balanceDueDays,
    incoterms,
    lane,
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

  const inputPayload = {
    input: {
      unitsPlanned,
      unitCostCents,
      ...(freightCents !== undefined ? { freightCents } : {}),
      ...(dutyCents !== undefined ? { dutyCents } : {}),
      ...(vatCents !== undefined ? { vatCents } : {}),
      ...(packagingCents !== undefined ? { packagingCents } : {}),
      ...(inspectionCents !== undefined ? { inspectionCents } : {}),
      ...(otherCents !== undefined ? { otherCents } : {}),
      ...(leadTimeDays !== undefined ? { leadTimeDays } : {}),
      ...(depositPct !== undefined ? { depositPct } : {}),
      ...(balanceDueDays !== undefined ? { balanceDueDays } : {}),
      ...(incoterms ? { incoterms } : {}),
      ...(lane ? { lane } : {}),
      ...(notes ? { notes } : {}),
    },
    inputVersion: inputVersion ?? "v1",
    ...(requestedBy ? { requestedBy } : {}),
  };

  const output: StageBOutput = computeStageBOutput({
    unitsPlanned,
    unitCostCents,
    ...(freightCents !== undefined ? { freightCents } : {}),
    ...(dutyCents !== undefined ? { dutyCents } : {}),
    ...(vatCents !== undefined ? { vatCents } : {}),
    ...(packagingCents !== undefined ? { packagingCents } : {}),
    ...(inspectionCents !== undefined ? { inspectionCents } : {}),
    ...(otherCents !== undefined ? { otherCents } : {}),
    ...(leadTimeDays !== undefined ? { leadTimeDays } : {}),
    ...(depositPct !== undefined ? { depositPct } : {}),
    ...(balanceDueDays !== undefined ? { balanceDueDays } : {}),
    ...(incoterms ? { incoterms } : {}),
    ...(lane ? { lane } : {}),
    ...(notes ? { notes } : {}),
  });
  const summary = output.summary;

  const now = nowIso();
  await db.batch([
    db
      .prepare(
        "INSERT INTO stage_runs (id, candidate_id, stage, status, input_version, input_json, output_json, error_json, started_at, finished_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        crypto.randomUUID(),
        candidateId,
        "B",
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
      .bind("B_DONE", now, candidateId),
  ]);

  return jsonResponse({ ok: true, candidateId, summary });
};
