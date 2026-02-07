"use client";

import type { StageNNegotiationStatus,StageRun } from "./types";

export type StageNInput = {
  status?: StageNNegotiationStatus;
  supplierName?: string;
  targetUnitCostCents?: number;
  targetMoq?: number;
  targetLeadTimeDays?: number;
  targetDepositPct?: number;
  targetPaymentTerms?: string;
  targetIncoterms?: string;
  tasks?: string[];
  notes?: string | null;
};

export type StageNSummary = {
  status?: StageNNegotiationStatus | null;
  supplierName?: string | null;
  targetUnitCostCents?: string | null;
  targetMoq?: number | null;
  targetLeadTimeDays?: number | null;
  targetDepositPct?: number | null;
  targetPaymentTerms?: string | null;
  targetIncoterms?: string | null;
  tasks?: string[] | null;
};

type StageNOutput = {
  summary?: StageNSummary;
};

export function extractStageNInput(stageRun?: StageRun): StageNInput | null {
  if (!stageRun?.input || typeof stageRun.input !== "object") return null;
  if ("input" in stageRun.input) {
    const nested = (stageRun.input as { input?: StageNInput }).input;
    if (nested && typeof nested === "object") return nested;
  }
  return stageRun.input as StageNInput;
}

export function extractStageNSummary(
  stageRun?: StageRun,
): StageNSummary | null {
  if (!stageRun?.output || typeof stageRun.output !== "object") return null;
  const summary = (stageRun.output as StageNOutput).summary;
  if (!summary || typeof summary !== "object") return null;
  return summary;
}

export function formatStageNTasks(items: string[] | undefined | null): string {
  if (!items || items.length === 0) return "";
  return items.join(", ");
}

export function parseStageNTasks(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
