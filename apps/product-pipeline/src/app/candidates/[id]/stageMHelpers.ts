"use client";

import type { StageRun } from "./types";

export type StageMSummary = {
  kind?: string | null;
  marketplace?: string | null;
  query?: string | null;
  url?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  priceMedian?: number | null;
  reviewMedian?: number | null;
  sponsoredShare?: number | null;
  sampleCount?: number | null;
  generatedAt?: string | null;
  captureMode?: string | null;
  headless?: boolean | null;
  humanGate?: boolean | null;
  humanGateOutcome?: string | null;
  playbook?: string | null;
  sessionProfile?: string | null;
  durationMs?: number | null;
};

type StageMCaptureMeta = {
  mode?: unknown;
  headless?: unknown;
  humanGate?: unknown;
  humanGateOutcome?: unknown;
  playbook?: unknown;
  sessionProfile?: unknown;
  durationMs?: unknown;
};

type StageMOutput = {
  kind?: unknown;
  marketplace?: unknown;
  query?: unknown;
  url?: unknown;
  priceMin?: unknown;
  priceMax?: unknown;
  priceMedian?: unknown;
  reviewMedian?: unknown;
  sponsoredShare?: unknown;
  priceSample?: unknown;
  generatedAt?: unknown;
  captureMeta?: unknown;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
}

function parseSampleCount(value: unknown): number | null {
  if (!Array.isArray(value)) return null;
  const count = value.filter((item) => typeof item === "number").length;
  return count > 0 ? count : null;
}

function parseCaptureMeta(value: unknown): StageMCaptureMeta | null {
  if (!value || typeof value !== "object") return null;
  return value as StageMCaptureMeta;
}

export function extractStageMSummary(stageRun?: StageRun): StageMSummary | null {
  if (!stageRun?.output || typeof stageRun.output !== "object") return null;
  const output = stageRun.output as StageMOutput;
  const captureMeta = parseCaptureMeta(output.captureMeta);

  return {
    kind: toString(output.kind),
    marketplace: toString(output.marketplace),
    query: toString(output.query),
    url: toString(output.url),
    priceMin: toNumber(output.priceMin),
    priceMax: toNumber(output.priceMax),
    priceMedian: toNumber(output.priceMedian),
    reviewMedian: toNumber(output.reviewMedian),
    sponsoredShare: toNumber(output.sponsoredShare),
    sampleCount: parseSampleCount(output.priceSample),
    generatedAt: toString(output.generatedAt),
    captureMode: toString(captureMeta?.mode),
    headless: toBoolean(captureMeta?.headless),
    humanGate: toBoolean(captureMeta?.humanGate),
    humanGateOutcome: toString(captureMeta?.humanGateOutcome),
    playbook: toString(captureMeta?.playbook),
    sessionProfile: toString(captureMeta?.sessionProfile),
    durationMs: toNumber(captureMeta?.durationMs),
  };
}
