"use client";

import type { StageRun } from "./types";

export type StageCInput = {
  salePriceCents?: number;
  platformFeePct?: number;
  fulfillmentFeeCents?: number;
  storageFeeCents?: number;
  advertisingCents?: number;
  otherFeesCents?: number;
  returnRatePct?: number;
  payoutDelayDays?: number;
  unitsPlanned?: number;
  notes?: string | null;
};

export type StageCSummary = {
  salePriceCents?: string;
  platformFeeCents?: string;
  returnLossCents?: string;
  netRevenuePerUnitCents?: string;
  contributionPerUnitCents?: string;
  contributionMarginPct?: number | null;
  payoutDelayDays?: number | null;
  totalContributionCents?: string | null;
};

type StageCOutput = {
  summary?: StageCSummary;
};

export function extractStageCInput(stageRun?: StageRun): StageCInput | null {
  if (!stageRun?.input || typeof stageRun.input !== "object") return null;
  if ("input" in stageRun.input) {
    const nested = (stageRun.input as { input?: StageCInput }).input;
    if (nested && typeof nested === "object") return nested;
  }
  return stageRun.input as StageCInput;
}

export function extractStageCSummary(
  stageRun?: StageRun,
): StageCSummary | null {
  if (!stageRun?.output || typeof stageRun.output !== "object") return null;
  const summary = (stageRun.output as StageCOutput).summary;
  if (!summary || typeof summary !== "object") return null;
  return summary;
}
