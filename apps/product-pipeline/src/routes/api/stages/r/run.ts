/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/r/run.ts

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

const bodySchema = z.object({
  candidateId: z.string().min(1),
  riskScore: z.number().min(0).max(100),
  effortScore: z.number().min(0).max(100),
  riskDrivers: z.array(z.string().min(1)).optional(),
  effortDrivers: z.array(z.string().min(1)).optional(),
  notes: z.string().min(1).optional(),
  requestedBy: z.string().min(1).optional(),
  inputVersion: z.string().min(1).optional(),
});

type StageKSummary = {
  annualizedCapitalReturnRate?: number | null;
};

type StageROutputSummary = {
  riskScore: number;
  riskBand: "low" | "medium" | "high";
  effortScore: number;
  effortBand: "low" | "medium" | "high";
  returnRate: number | null;
  rankScore: number | null;
  nextAction: "ADVANCE" | "REVIEW_RISK" | "REVIEW_EFFORT" | "NEED_STAGE_K";
};

type StageROutput = {
  engineVersion: string;
  summary: StageROutputSummary;
  drivers: {
    risk: string[];
    effort: string[];
  };
  notes: string | null;
};

const ENGINE_VERSION = "stage-r:v1";

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function scoreBand(score: number): "low" | "medium" | "high" {
  if (score <= 33) return "low";
  if (score <= 66) return "medium";
  return "high";
}

function computeRankScore(
  returnRate: number | null,
  riskScore: number,
  effortScore: number,
): number | null {
  if (returnRate === null || !Number.isFinite(returnRate)) return null;
  const riskFactor = 1 - riskScore / 100;
  const effortFactor = 1 - effortScore / 100;
  const score = returnRate * riskFactor * effortFactor;
  return Number.isFinite(score) ? Number(score.toFixed(6)) : null;
}

function resolveNextAction(
  returnRate: number | null,
  riskScore: number,
  effortScore: number,
): StageROutputSummary["nextAction"] {
  if (returnRate === null) return "NEED_STAGE_K";
  if (riskScore >= 70) return "REVIEW_RISK";
  if (effortScore >= 70) return "REVIEW_EFFORT";
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
    riskScore,
    effortScore,
    riskDrivers,
    effortDrivers,
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

  const stageKRow = await db
    .prepare(
      "SELECT output_json FROM stage_runs WHERE candidate_id = ? AND stage = 'K' ORDER BY created_at DESC LIMIT 1",
    )
    .bind(candidateId)
    .first<{ output_json: string | null }>();

  const stageKOutput = safeJsonParse<{ summary?: StageKSummary }>(
    stageKRow?.output_json ?? null,
  );
  const returnRate =
    stageKOutput?.summary?.annualizedCapitalReturnRate ?? null;

  const summary: StageROutputSummary = {
    riskScore,
    riskBand: scoreBand(riskScore),
    effortScore,
    effortBand: scoreBand(effortScore),
    returnRate,
    rankScore: computeRankScore(returnRate, riskScore, effortScore),
    nextAction: resolveNextAction(returnRate, riskScore, effortScore),
  };

  const inputPayload = {
    input: {
      riskScore,
      effortScore,
      riskDrivers: riskDrivers ?? [],
      effortDrivers: effortDrivers ?? [],
      notes: notes ?? null,
    },
    inputVersion: inputVersion ?? "v1",
    ...(requestedBy ? { requestedBy } : {}),
  };

  const output: StageROutput = {
    engineVersion: ENGINE_VERSION,
    summary,
    drivers: {
      risk: riskDrivers ?? [],
      effort: effortDrivers ?? [],
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
        "R",
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
      .bind("R_DONE", now, candidateId),
  ]);

  return jsonResponse({ ok: true, candidateId, summary });
};
