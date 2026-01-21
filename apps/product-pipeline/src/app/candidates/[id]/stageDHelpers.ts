"use client";

import type { StageDAssetReadiness,StageRun } from "./types";

export type StageDInput = {
  assetReadiness?: StageDAssetReadiness;
  oneTimeCostCents?: number;
  samplingRounds?: number;
  leadTimeDays?: number;
  packagingStatus?: string;
  notes?: string | null;
};

export type StageDSummary = {
  assetReadiness?: StageDAssetReadiness | null;
  oneTimeCostCents?: string | null;
  samplingRounds?: number | null;
  leadTimeDays?: number | null;
  packagingStatus?: string | null;
};

type StageDOutput = {
  summary?: StageDSummary;
};

export function extractStageDInput(stageRun?: StageRun): StageDInput | null {
  if (!stageRun?.input || typeof stageRun.input !== "object") return null;
  if ("input" in stageRun.input) {
    const nested = (stageRun.input as { input?: StageDInput }).input;
    if (nested && typeof nested === "object") return nested;
  }
  return stageRun.input as StageDInput;
}

export function extractStageDSummary(
  stageRun?: StageRun,
): StageDSummary | null {
  if (!stageRun?.output || typeof stageRun.output !== "object") return null;
  const summary = (stageRun.output as StageDOutput).summary;
  if (!summary || typeof summary !== "object") return null;
  return summary;
}
