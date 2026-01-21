/* i18n-exempt file -- PP-1100 internal pipeline helper [ttl=2026-06-30] */
// apps/product-pipeline/src/lib/pipeline/stage-k-lane-compare.ts

import type { StageKInput, StageKResult } from "@acme/pipeline-engine";

import type { StageBInput } from "./stage-b";
import type { StageKInputPayload } from "./stage-k-scenario";

export type StageKSummary = {
  peakCashOutlayCents: string;
  paybackDay: number | null;
  annualizedCapitalReturnRate: number | null;
  returnBand: "low" | "medium" | "high" | "unknown";
};

export type LaneVersionSnapshot = {
  id: string;
  lane_id: string;
  status: string;
  confidence: string;
  expires_at: string | null;
  cost_basis: string | null;
  cost_amount: number | null;
  lead_time_base_days: number | null;
  lane_name: string;
  lane_model: string;
  lane_incoterm: string | null;
};

export type LaneWarning = {
  code:
    | "expired"
    | "expiring"
    | "low_confidence"
    | "basis_non_unit"
    | "missing_cost"
    | "missing_lead_time";
  days?: number;
};

export function safeJsonParse(value: string | null): unknown | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function unwrapStageBInput(payload: unknown): StageBInput | null {
  if (!payload || typeof payload !== "object") return null;
  if ("input" in payload) {
    const nested = (payload as { input?: StageBInput }).input;
    if (nested && typeof nested === "object") return nested;
  }
  return payload as StageBInput;
}

export function toStageKInput(payload: StageKInputPayload): StageKInput {
  return {
    horizonDays: payload.horizonDays,
    cashflows: payload.cashflows.map((flow) => ({
      day: flow.day,
      amountCents: BigInt(Math.round(flow.amountCents)),
    })),
    ...(payload.unitsPlanned !== undefined
      ? { unitsPlanned: payload.unitsPlanned }
      : {}),
    ...(payload.unitsSoldByDay !== undefined
      ? { unitsSoldByDay: payload.unitsSoldByDay }
      : {}),
    ...(payload.sellThroughTargetPct !== undefined
      ? { sellThroughTargetPct: payload.sellThroughTargetPct }
      : {}),
    ...(payload.salvageValueCents !== undefined
      ? { salvageValueCents: BigInt(Math.round(payload.salvageValueCents)) }
      : {}),
  };
}

export function deriveReturnBand(
  annualizedReturnRate: number | null,
): StageKSummary["returnBand"] {
  if (annualizedReturnRate === null) return "unknown";
  if (annualizedReturnRate < 0.1) return "low";
  if (annualizedReturnRate < 0.25) return "medium";
  return "high";
}

export function buildSummary(result: StageKResult): StageKSummary {
  return {
    peakCashOutlayCents: result.peakCashOutlayCents.toString(),
    paybackDay: result.paybackDay,
    annualizedCapitalReturnRate: result.annualizedCapitalReturnRate,
    returnBand: deriveReturnBand(result.annualizedCapitalReturnRate),
  };
}

export function buildLaneWarnings(row: LaneVersionSnapshot): LaneWarning[] {
  const warnings: LaneWarning[] = [];
  if (row.expires_at) {
    const parsed = new Date(row.expires_at);
    if (!Number.isNaN(parsed.getTime())) {
      const diffMs = parsed.getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / 86_400_000);
      if (diffDays < 0) {
        warnings.push({ code: "expired" });
      } else if (diffDays <= 14) {
        warnings.push({ code: "expiring", days: diffDays });
      }
    }
  }

  const confidence = row.confidence?.toUpperCase();
  if (confidence === "C0" || confidence === "C1") {
    warnings.push({ code: "low_confidence" });
  }

  if (row.cost_basis) {
    const normalized = row.cost_basis.toLowerCase();
    if (!(normalized.includes("unit") || normalized.includes("/unit"))) {
      warnings.push({ code: "basis_non_unit" });
    }
  }

  if (row.cost_amount === null || row.cost_amount === undefined) {
    warnings.push({ code: "missing_cost" });
  }

  if (row.lead_time_base_days === null || row.lead_time_base_days === undefined) {
    warnings.push({ code: "missing_lead_time" });
  }

  return warnings;
}

export function laneMetaFromRow(row: LaneVersionSnapshot) {
  return {
    laneId: row.lane_id,
    laneName: row.lane_name,
    laneModel: row.lane_model,
    laneIncoterm: row.lane_incoterm,
    laneVersionId: row.id,
    laneStatus: row.status,
    laneConfidence: row.confidence,
    laneExpiresAt: row.expires_at,
    laneCostBasis: row.cost_basis,
    laneCostAmount: row.cost_amount,
    laneLeadTimeBaseDays: row.lead_time_base_days,
  };
}

export function buildAdjustedStageBInput(
  baseInput: StageBInput,
  row: LaneVersionSnapshot,
): StageBInput {
  const freightCents =
    row.cost_amount === null || row.cost_amount === undefined
      ? baseInput.freightCents
      : Math.round(row.cost_amount * 100);
  const leadTimeDays =
    row.lead_time_base_days === null || row.lead_time_base_days === undefined
      ? baseInput.leadTimeDays
      : row.lead_time_base_days;
  const incoterms = row.lane_incoterm ?? baseInput.incoterms;

  return {
    ...baseInput,
    ...(freightCents !== undefined ? { freightCents } : {}),
    ...(leadTimeDays !== undefined ? { leadTimeDays } : {}),
    ...(incoterms ? { incoterms } : {}),
    lane: laneMetaFromRow(row),
  };
}
