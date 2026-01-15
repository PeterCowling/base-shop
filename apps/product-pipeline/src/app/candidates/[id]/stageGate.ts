"use client";

import type { CandidateDetailStrings, StageRun } from "./types";
import { extractStageSSummary } from "./stageSHelpers";
import { extractStageTSummary } from "./stageTHelpers";

export type StageGateCode =
  | "stage_t_blocked"
  | "stage_t_needs_review"
  | "stage_s_blocked";

function latestStageRun(stageRuns: StageRun[], stage: string): StageRun | null {
  return stageRuns.find((run) => run.stage === stage && run.status === "succeeded") ?? null;
}

export function resolveStageTGate(stageRuns: StageRun[]): StageGateCode | null {
  const stageT = latestStageRun(stageRuns, "T");
  const summary = extractStageTSummary(stageT ?? undefined);
  if (summary?.decision === "blocked") return "stage_t_blocked";
  if (summary?.decision === "needs_review") return "stage_t_needs_review";
  return null;
}

export function resolveStageTSGate(stageRuns: StageRun[]): StageGateCode | null {
  const stageTGate = resolveStageTGate(stageRuns);
  if (stageTGate) return stageTGate;
  const stageS = latestStageRun(stageRuns, "S");
  const summary = extractStageSSummary(stageS ?? undefined);
  if (summary?.overallRisk === "high" || summary?.action === "BLOCK") {
    return "stage_s_blocked";
  }
  return null;
}

export function gateMessage(
  gate: StageGateCode | null,
  strings: CandidateDetailStrings["gates"],
): string | null {
  return resolveGateMessage(gate, strings);
}

export function resolveGateMessage(
  gate: StageGateCode | string | null | undefined,
  strings: CandidateDetailStrings["gates"],
): string | null {
  if (!gate) return null;
  if (gate === "stage_t_blocked") return strings.stageTBlocked;
  if (gate === "stage_t_needs_review") return strings.stageTNeedsReview;
  if (gate === "stage_s_blocked") return strings.stageSBlocked;
  return null;
}
