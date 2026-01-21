/* i18n-exempt file -- PP-1100 internal pipeline API helpers [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/_lib/stage-gating.ts

import { fetchLatestStageRunByStage } from "./db";
import type { D1Database } from "./types";

type StageTDecision = "allowed" | "needs_review" | "blocked";
type StageSRiskBand = "low" | "medium" | "high";
type StageSAction = "ADVANCE" | "REVIEW" | "BLOCK";

type StageGateBlock = {
  code: "stage_t_blocked" | "stage_t_needs_review" | "stage_s_blocked";
  details: Record<string, unknown>;
};

type StageTOutput = {
  summary?: {
    decision?: StageTDecision;
    action?: string;
  };
};

type StageSOutput = {
  summary?: {
    overallRisk?: StageSRiskBand;
    action?: StageSAction | string;
  };
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function parseStageTDecision(outputJson: string | null): StageTDecision | null {
  const output = safeJsonParse<StageTOutput>(outputJson);
  const decision = output?.summary?.decision ?? null;
  if (decision === "allowed" || decision === "needs_review" || decision === "blocked") {
    return decision;
  }
  return null;
}

function parseStageSStatus(
  outputJson: string | null,
): { risk: StageSRiskBand | null; action: StageSAction | null } {
  const output = safeJsonParse<StageSOutput>(outputJson);
  const risk = output?.summary?.overallRisk ?? null;
  const action = output?.summary?.action ?? null;
  return {
    risk: risk === "low" || risk === "medium" || risk === "high" ? risk : null,
    action: action === "ADVANCE" || action === "REVIEW" || action === "BLOCK" ? action : null,
  };
}

export async function checkStageTGate(
  db: D1Database,
  candidateId: string,
): Promise<StageGateBlock | null> {
  const stageT = await fetchLatestStageRunByStage(db, candidateId, "T");
  if (!stageT) return null;
  const decision = parseStageTDecision(stageT.output_json);
  if (decision === "blocked") {
    return {
      code: "stage_t_blocked",
      details: { decision, stageRunId: stageT.id },
    };
  }
  if (decision === "needs_review") {
    return {
      code: "stage_t_needs_review",
      details: { decision, stageRunId: stageT.id },
    };
  }
  return null;
}

export async function checkStageSGate(
  db: D1Database,
  candidateId: string,
): Promise<StageGateBlock | null> {
  const stageS = await fetchLatestStageRunByStage(db, candidateId, "S");
  if (!stageS) return null;
  const { risk, action } = parseStageSStatus(stageS.output_json);
  if (risk === "high" || action === "BLOCK") {
    return {
      code: "stage_s_blocked",
      details: { risk, action, stageRunId: stageS.id },
    };
  }
  return null;
}

export async function checkStageTSGate(
  db: D1Database,
  candidateId: string,
): Promise<StageGateBlock | null> {
  const stageTGate = await checkStageTGate(db, candidateId);
  if (stageTGate) return stageTGate;
  return checkStageSGate(db, candidateId);
}
