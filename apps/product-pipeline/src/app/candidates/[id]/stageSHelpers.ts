"use client";

import type { StageRun, StageSRiskBand } from "./types";

export type StageSInput = {
  complianceRisk?: StageSRiskBand;
  ipRisk?: StageSRiskBand;
  hazmatRisk?: StageSRiskBand;
  shippingRisk?: StageSRiskBand;
  listingRisk?: StageSRiskBand;
  packagingRisk?: StageSRiskBand;
  matchingConfidence?: number;
  artifactsRequired?: string[];
  notes?: string | null;
};

export type StageSSummary = {
  overallRisk?: StageSRiskBand | null;
  action?: string | null;
  feasibilityScore?: number | null;
  matchingConfidence?: number | null;
  flaggedCategories?: string[];
};

type StageSOutput = {
  summary?: StageSSummary;
};

export function extractStageSInput(stageRun?: StageRun): StageSInput | null {
  if (!stageRun?.input || typeof stageRun.input !== "object") return null;
  if ("input" in stageRun.input) {
    const nested = (stageRun.input as { input?: StageSInput }).input;
    if (nested && typeof nested === "object") return nested;
  }
  return stageRun.input as StageSInput;
}

export function extractStageSSummary(stageRun?: StageRun): StageSSummary | null {
  if (!stageRun?.output || typeof stageRun.output !== "object") return null;
  const summary = (stageRun.output as StageSOutput).summary;
  if (!summary || typeof summary !== "object") return null;
  return summary;
}

export function formatStageSList(items: string[] | undefined): string {
  if (!items || items.length === 0) return "";
  return items.join(", ");
}

export function parseStageSList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
