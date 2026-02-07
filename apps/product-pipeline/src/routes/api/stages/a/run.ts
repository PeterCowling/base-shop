/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/a/run.ts

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

const centsSchema = z.number().int().min(0);

const bodySchema = z.object({
  candidateId: z.string().min(1),
  salePriceCents: z.number().int().positive(),
  unitCostCents: centsSchema,
  shippingCents: centsSchema.optional(),
  feesPct: z.number().min(0).max(100).optional(),
  targetMarginPct: z.number().min(0).max(100).optional(),
  notes: z.string().min(1).optional(),
  requestedBy: z.string().min(1).optional(),
  inputVersion: z.string().min(1).optional(),
});

type StageAAction = "advance" | "review" | "reject";

type StageAOutputSummary = {
  marginPct: number | null;
  netPerUnitCents: string | null;
  action: StageAAction | null;
  targetMarginPct: number | null;
};

type StageAOutput = {
  engineVersion: string;
  summary: StageAOutputSummary;
  notes: string | null;
};

const ENGINE_VERSION = "stage-a:v1";

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
    salePriceCents,
    unitCostCents,
    shippingCents,
    feesPct,
    targetMarginPct,
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

  const feesCents = Math.round(salePriceCents * ((feesPct ?? 0) / 100));
  const netPerUnitCents =
    salePriceCents -
    unitCostCents -
    (shippingCents ?? 0) -
    feesCents;
  const marginPct =
    salePriceCents > 0
      ? Number(((netPerUnitCents / salePriceCents) * 100).toFixed(2))
      : null;
  const threshold = targetMarginPct ?? 25;

  let action: StageAAction = "advance";
  if (marginPct === null) {
    action = "review";
  } else if (marginPct < threshold - 10) {
    action = "reject";
  } else if (marginPct < threshold) {
    action = "review";
  }

  const summary: StageAOutputSummary = {
    marginPct,
    netPerUnitCents: toString(netPerUnitCents),
    action,
    targetMarginPct: threshold,
  };

  const inputPayload = {
    input: {
      salePriceCents,
      unitCostCents,
      ...(shippingCents !== undefined ? { shippingCents } : {}),
      ...(feesPct !== undefined ? { feesPct } : {}),
      ...(targetMarginPct !== undefined ? { targetMarginPct } : {}),
      ...(notes ? { notes } : {}),
    },
    inputVersion: inputVersion ?? "v1",
    ...(requestedBy ? { requestedBy } : {}),
  };

  const output: StageAOutput = {
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
        "A",
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
      .bind("A_DONE", now, candidateId),
  ]);

  return jsonResponse({ ok: true, candidateId, summary });
};
