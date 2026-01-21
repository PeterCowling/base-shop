"use client";

import type { StageRun } from "./types";

export type StageTDecision = "allowed" | "needs_review" | "blocked";

export type StageTInput = {
  decision?: StageTDecision;
  reasonCodes?: string[];
  requiredEvidence?: string[];
  notes?: string | null;
};

export type StageTSummary = {
  decision?: StageTDecision | null;
  action?: string | null;
  requiredEvidenceCount?: number | null;
  reasonCodes?: string[];
  requiredEvidence?: string[];
};

type StageTOutput = {
  summary?: StageTSummary;
  requiredEvidence?: string[];
  reasons?: string[];
};

export function extractStageTInput(stageRun?: StageRun): StageTInput | null {
  if (!stageRun?.input || typeof stageRun.input !== "object") return null;
  if ("input" in stageRun.input) {
    const nested = (stageRun.input as { input?: StageTInput }).input;
    if (nested && typeof nested === "object") return nested;
  }
  return stageRun.input as StageTInput;
}

export function extractStageTSummary(stageRun?: StageRun): StageTSummary | null {
  if (!stageRun?.output || typeof stageRun.output !== "object") return null;
  const output = stageRun.output as StageTOutput;
  const summary = output.summary;
  if (!summary || typeof summary !== "object") return null;
  return {
    ...summary,
    requiredEvidence: output.requiredEvidence ?? summary.requiredEvidence ?? [],
    reasonCodes: output.reasons ?? summary.reasonCodes ?? [],
  };
}

export function formatStageTList(items: string[] | undefined): string {
  if (!items || items.length === 0) return "";
  return items.join(", ");
}

export function parseStageTList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
