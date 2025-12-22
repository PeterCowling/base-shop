/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/c/run.ts

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
import { errorResponse, jsonResponse } from "../../_lib/response";

const centsSchema = z.number().int().min(0);

const bodySchema = z.object({
  candidateId: z.string().min(1),
  salePriceCents: z.number().int().positive(),
  platformFeePct: z.number().min(0).max(100),
  fulfillmentFeeCents: centsSchema.optional(),
  storageFeeCents: centsSchema.optional(),
  advertisingCents: centsSchema.optional(),
  otherFeesCents: centsSchema.optional(),
  returnRatePct: z.number().min(0).max(100).optional(),
  payoutDelayDays: z.number().int().min(0).max(3650).optional(),
  unitsPlanned: z.number().int().positive().optional(),
  notes: z.string().min(1).optional(),
  requestedBy: z.string().min(1).optional(),
  inputVersion: z.string().min(1).optional(),
});

type StageCOutputSummary = {
  salePriceCents: string;
  platformFeeCents: string;
  returnLossCents: string;
  netRevenuePerUnitCents: string;
  contributionPerUnitCents: string;
  contributionMarginPct: number | null;
  payoutDelayDays: number | null;
  totalContributionCents: string | null;
};

type StageCOutput = {
  engineVersion: string;
  summary: StageCOutputSummary;
  fees: {
    fulfillmentFeeCents: string;
    storageFeeCents: string;
    advertisingCents: string;
    otherFeesCents: string;
  };
  notes: string | null;
};

const ENGINE_VERSION = "stage-c:v1";

function optionalCents(value: number | undefined): number {
  return value ?? 0;
}

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
    platformFeePct,
    fulfillmentFeeCents,
    storageFeeCents,
    advertisingCents,
    otherFeesCents,
    returnRatePct,
    payoutDelayDays,
    unitsPlanned,
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

  const platformFeeCents = Math.round(
    (salePriceCents * platformFeePct) / 100,
  );
  const returnLossCents = Math.round(
    (salePriceCents * (returnRatePct ?? 0)) / 100,
  );
  const netRevenuePerUnitCents =
    salePriceCents - platformFeeCents - returnLossCents;
  const contributionPerUnitCents =
    netRevenuePerUnitCents -
    optionalCents(fulfillmentFeeCents) -
    optionalCents(storageFeeCents) -
    optionalCents(advertisingCents) -
    optionalCents(otherFeesCents);
  const contributionMarginPct =
    salePriceCents > 0
      ? Number(((contributionPerUnitCents / salePriceCents) * 100).toFixed(2))
      : null;
  const totalContributionCents =
    unitsPlanned !== undefined
      ? contributionPerUnitCents * unitsPlanned
      : null;

  const summary: StageCOutputSummary = {
    salePriceCents: String(salePriceCents),
    platformFeeCents: String(platformFeeCents),
    returnLossCents: String(returnLossCents),
    netRevenuePerUnitCents: String(netRevenuePerUnitCents),
    contributionPerUnitCents: String(contributionPerUnitCents),
    contributionMarginPct,
    payoutDelayDays: payoutDelayDays ?? null,
    totalContributionCents: toString(totalContributionCents),
  };

  const inputPayload = {
    input: {
      salePriceCents,
      platformFeePct,
      ...(fulfillmentFeeCents !== undefined ? { fulfillmentFeeCents } : {}),
      ...(storageFeeCents !== undefined ? { storageFeeCents } : {}),
      ...(advertisingCents !== undefined ? { advertisingCents } : {}),
      ...(otherFeesCents !== undefined ? { otherFeesCents } : {}),
      ...(returnRatePct !== undefined ? { returnRatePct } : {}),
      ...(payoutDelayDays !== undefined ? { payoutDelayDays } : {}),
      ...(unitsPlanned !== undefined ? { unitsPlanned } : {}),
      ...(notes ? { notes } : {}),
    },
    inputVersion: inputVersion ?? "v1",
    ...(requestedBy ? { requestedBy } : {}),
  };

  const output: StageCOutput = {
    engineVersion: ENGINE_VERSION,
    summary,
    fees: {
      fulfillmentFeeCents: String(optionalCents(fulfillmentFeeCents)),
      storageFeeCents: String(optionalCents(storageFeeCents)),
      advertisingCents: String(optionalCents(advertisingCents)),
      otherFeesCents: String(optionalCents(otherFeesCents)),
    },
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
        "C",
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
      .bind("C_DONE", now, candidateId),
  ]);

  return jsonResponse({ ok: true, candidateId, summary });
};
