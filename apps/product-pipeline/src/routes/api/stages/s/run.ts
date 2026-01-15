/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/s/run.ts

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
import { checkStageTGate } from "../../_lib/stage-gating";
import { errorResponse, jsonResponse } from "../../_lib/response";

const riskBandSchema = z.enum(["low", "medium", "high"]);

const bodySchema = z.object({
  candidateId: z.string().min(1),
  complianceRisk: riskBandSchema,
  ipRisk: riskBandSchema,
  hazmatRisk: riskBandSchema,
  shippingRisk: riskBandSchema,
  listingRisk: riskBandSchema,
  packagingRisk: riskBandSchema,
  matchingConfidence: z.number().min(0).max(100).optional(),
  artifactsRequired: z.array(z.string().min(1)).optional(),
  notes: z.string().min(1).optional(),
  requestedBy: z.string().min(1).optional(),
  inputVersion: z.string().min(1).optional(),
});

type RiskBand = z.infer<typeof riskBandSchema>;

type StageSOutputSummary = {
  overallRisk: RiskBand;
  action: "ADVANCE" | "REVIEW" | "BLOCK";
  feasibilityScore: number;
  matchingConfidence: number | null;
  flaggedCategories: string[];
};

type StageSOutput = {
  engineVersion: string;
  summary: StageSOutputSummary;
  flags: {
    complianceRisk: RiskBand;
    ipRisk: RiskBand;
    hazmatRisk: RiskBand;
    shippingRisk: RiskBand;
    listingRisk: RiskBand;
    packagingRisk: RiskBand;
  };
  artifactsRequired: string[];
  notes: string | null;
};

const ENGINE_VERSION = "stage-s:v1";

const RISK_WEIGHT: Record<RiskBand, number> = {
  low: 0,
  medium: 15,
  high: 35,
};

function highestRisk(risks: RiskBand[]): RiskBand {
  if (risks.includes("high")) return "high";
  if (risks.includes("medium")) return "medium";
  return "low";
}

function resolveAction(risk: RiskBand): StageSOutputSummary["action"] {
  if (risk === "high") return "BLOCK";
  if (risk === "medium") return "REVIEW";
  return "ADVANCE";
}

function computeFeasibilityScore(risks: RiskBand[]): number {
  const penalty = risks.reduce((sum, risk) => sum + RISK_WEIGHT[risk], 0);
  return Math.max(0, Math.round(100 - penalty));
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
    complianceRisk,
    ipRisk,
    hazmatRisk,
    shippingRisk,
    listingRisk,
    packagingRisk,
    matchingConfidence,
    artifactsRequired,
    notes,
    requestedBy,
    inputVersion,
  } = parsed.data;

  const db = getDb(env);
  const candidate = await fetchCandidateById(db, candidateId);
  if (!candidate) {
    return errorResponse(404, "candidate_not_found", { candidateId });
  }

  const stageTGate = await checkStageTGate(db, candidateId);
  if (stageTGate) {
    return errorResponse(409, stageTGate.code, stageTGate.details);
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

  const risks = [
    complianceRisk,
    ipRisk,
    hazmatRisk,
    shippingRisk,
    listingRisk,
    packagingRisk,
  ];
  const overallRisk = highestRisk(risks);
  const summary: StageSOutputSummary = {
    overallRisk,
    action: resolveAction(overallRisk),
    feasibilityScore: computeFeasibilityScore(risks),
    matchingConfidence: matchingConfidence ?? null,
    flaggedCategories: [
      complianceRisk !== "low" ? `compliance:${complianceRisk}` : null,
      ipRisk !== "low" ? `ip:${ipRisk}` : null,
      hazmatRisk !== "low" ? `hazmat:${hazmatRisk}` : null,
      shippingRisk !== "low" ? `shipping:${shippingRisk}` : null,
      listingRisk !== "low" ? `listing:${listingRisk}` : null,
      packagingRisk !== "low" ? `packaging:${packagingRisk}` : null,
    ].filter((value): value is string => Boolean(value)),
  };

  const inputPayload = {
    input: {
      complianceRisk,
      ipRisk,
      hazmatRisk,
      shippingRisk,
      listingRisk,
      packagingRisk,
      ...(matchingConfidence !== undefined ? { matchingConfidence } : {}),
      ...(artifactsRequired ? { artifactsRequired } : {}),
      ...(notes ? { notes } : {}),
    },
    inputVersion: inputVersion ?? "v1",
    ...(requestedBy ? { requestedBy } : {}),
  };

  const output: StageSOutput = {
    engineVersion: ENGINE_VERSION,
    summary,
    flags: {
      complianceRisk,
      ipRisk,
      hazmatRisk,
      shippingRisk,
      listingRisk,
      packagingRisk,
    },
    artifactsRequired: artifactsRequired ?? [],
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
        "S",
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
      .bind("S_DONE", now, candidateId),
  ]);

  return jsonResponse({ ok: true, candidateId, summary });
};
