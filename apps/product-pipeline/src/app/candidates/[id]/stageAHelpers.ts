"use client";

import type { StageAAction,StageRun } from "./types";

export type StageAInput = {
  salePriceCents?: number;
  unitCostCents?: number;
  shippingCents?: number;
  feesPct?: number;
  targetMarginPct?: number;
  notes?: string | null;
};

export type StageASummary = {
  marginPct?: number | null;
  netPerUnitCents?: string | null;
  action?: StageAAction | null;
  targetMarginPct?: number | null;
};

type StageAOutput = {
  summary?: StageASummary;
};

export function extractStageAInput(stageRun?: StageRun): StageAInput | null {
  if (!stageRun?.input || typeof stageRun.input !== "object") return null;
  if ("input" in stageRun.input) {
    const nested = (stageRun.input as { input?: StageAInput }).input;
    if (nested && typeof nested === "object") return nested;
  }
  return stageRun.input as StageAInput;
}

export function extractStageASummary(
  stageRun?: StageRun,
): StageASummary | null {
  if (!stageRun?.output || typeof stageRun.output !== "object") return null;
  const summary = (stageRun.output as StageAOutput).summary;
  if (!summary || typeof summary !== "object") return null;
  return summary;
}
