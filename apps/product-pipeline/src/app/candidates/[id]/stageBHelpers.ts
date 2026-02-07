"use client";

import type { StageRun } from "./types";

export type StageBLaneMeta = {
  laneId?: string | null;
  laneName?: string | null;
  laneModel?: string | null;
  laneIncoterm?: string | null;
  laneVersionId?: string | null;
  laneVersionLabel?: string | null;
  laneStatus?: string | null;
  laneConfidence?: string | null;
  laneExpiresAt?: string | null;
  laneCurrency?: string | null;
  laneSourceCurrency?: string | null;
  laneFxRate?: number | null;
  laneFxDate?: string | null;
  laneFxSource?: string | null;
  laneLeadTimeBaseDays?: number | null;
  laneCostBasis?: string | null;
  laneCostAmount?: number | null;
};

export type StageBQuoteBasketMeta = {
  profileId?: string | null;
  name?: string | null;
  profileType?: string | null;
  origin?: string | null;
  destination?: string | null;
  destinationType?: string | null;
  incoterm?: string | null;
  cartonCount?: number | null;
  unitsPerCarton?: number | null;
  weightKg?: number | null;
  cbm?: number | null;
  dimensionsCm?: string | null;
  hazmatFlag?: boolean | null;
  notes?: string | null;
};

export type StageBInput = {
  unitsPlanned?: number;
  unitCostCents?: number;
  freightCents?: number;
  dutyCents?: number;
  vatCents?: number;
  packagingCents?: number;
  inspectionCents?: number;
  otherCents?: number;
  leadTimeDays?: number;
  depositPct?: number;
  balanceDueDays?: number;
  incoterms?: string;
  notes?: string | null;
  lane?: StageBLaneMeta;
  quoteBasket?: StageBQuoteBasketMeta;
};

export type StageBSummary = {
  perUnitLandedCostCents?: string;
  totalLandedCostCents?: string;
  depositPct?: number | null;
  depositAmountCents?: string | null;
  balanceAmountCents?: string | null;
  leadTimeDays?: number | null;
  balanceDueDays?: number | null;
  balanceDueDay?: number | null;
};

type StageBOutput = {
  summary?: StageBSummary;
};

export function extractStageBInput(stageRun?: StageRun): StageBInput | null {
  if (!stageRun?.input || typeof stageRun.input !== "object") return null;
  if ("input" in stageRun.input) {
    const nested = (stageRun.input as { input?: StageBInput }).input;
    if (nested && typeof nested === "object") return nested;
  }
  return stageRun.input as StageBInput;
}

export function extractStageBSummary(
  stageRun?: StageRun,
): StageBSummary | null {
  if (!stageRun?.output || typeof stageRun.output !== "object") return null;
  const summary = (stageRun.output as StageBOutput).summary;
  if (!summary || typeof summary !== "object") return null;
  return summary;
}
