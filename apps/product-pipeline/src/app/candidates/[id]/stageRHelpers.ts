"use client";

import type { StageRun } from "./types";

export type StageRSummary = {
  riskScore?: number | null;
  riskBand?: string | null;
  effortScore?: number | null;
  effortBand?: string | null;
  rankScore?: number | null;
  nextAction?: string | null;
};

type StageROutput = {
  summary?: StageRSummary;
};

export type StageRInput = {
  riskScore?: number;
  effortScore?: number;
  riskDrivers?: string[];
  effortDrivers?: string[];
  notes?: string | null;
};

export function extractStageRInput(stageRun?: StageRun): StageRInput | null {
  if (!stageRun?.input || typeof stageRun.input !== "object") return null;
  if ("input" in stageRun.input) {
    const nested = (stageRun.input as { input?: StageRInput }).input;
    if (nested && typeof nested === "object") return nested;
  }
  return stageRun.input as StageRInput;
}

export function extractStageRSummary(stageRun?: StageRun): StageRSummary | null {
  if (!stageRun?.output || typeof stageRun.output !== "object") return null;
  const summary = (stageRun.output as StageROutput).summary;
  if (!summary || typeof summary !== "object") return null;
  return summary;
}

export function formatStageRDrivers(drivers: string[] | undefined): string {
  if (!drivers || drivers.length === 0) return "";
  return drivers.join(", ");
}

export function parseStageRDrivers(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatStageRScore(
  score: number | null | undefined,
  band: string | null | undefined,
  fallback: string,
): string {
  if (score === null || score === undefined) return fallback;
  const bandLabel = band ? band.toUpperCase() : fallback;
  return `${score} (${bandLabel})`;
}
