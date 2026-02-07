"use client";

import { Grid, Stack } from "@acme/design-system/primitives";

import { formatNumber, formatPercent } from "@/lib/format";

import type { StageMSummary } from "./stageMHelpers";
import type { CandidateDetailStrings } from "./types";
import { safeTimestamp } from "./types";

function formatEuro(value: number | null | undefined, fallback: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
  fallback: string,
): string {
  if (min === null || min === undefined || max === null || max === undefined) {
    return fallback;
  }
  return `${formatEuro(min, fallback)} - ${formatEuro(max, fallback)}`;
}

function resolveKindLabel(
  kind: string | null | undefined,
  strings: CandidateDetailStrings["stageM"],
  fallback: string,
): string {
  if (!kind) return fallback;
  switch (kind) {
    case "amazon_search":
      return strings.kindAmazonSearch;
    case "amazon_listing":
      return strings.kindAmazonListing;
    case "taobao_listing":
      return strings.kindTaobaoListing;
    default:
      return kind;
  }
}

function buildContext(
  summary: StageMSummary,
  strings: CandidateDetailStrings["stageM"],
  fallback: string,
): string {
  const parts: string[] = [];
  const kindLabel = resolveKindLabel(summary.kind, strings, "");
  if (kindLabel) parts.push(kindLabel);
  if (summary.marketplace) parts.push(summary.marketplace.toUpperCase());
  if (summary.query) {
    parts.push(summary.query);
  } else if (summary.url) {
    parts.push(summary.url);
  }
  return parts.length > 0 ? parts.join(" | ") : fallback;
}

function formatDuration(ms: number | null | undefined, fallback: string): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return fallback;
  const seconds = ms / 1000;
  if (seconds < 1) return `${Math.round(ms)}ms`;
  return `${seconds.toFixed(1)}s`;
}

function buildCaptureDetails(
  summary: StageMSummary,
  strings: CandidateDetailStrings["stageM"],
  fallback: string,
): string | null {
  const parts: string[] = [];
  if (summary.captureMode) {
    parts.push(`${strings.summaryCaptureMode}: ${summary.captureMode}`);
  }
  if (summary.headless !== null && summary.headless !== undefined) {
    parts.push(
      `${strings.summaryHeadless}: ${
        summary.headless ? strings.summaryHeadlessOn : strings.summaryHeadlessOff
      }`,
    );
  }
  if (summary.humanGate !== null && summary.humanGate !== undefined) {
    let gateValue = summary.humanGate
      ? strings.summaryHumanGateOn
      : strings.summaryHumanGateOff;
    if (summary.humanGateOutcome === "accepted") {
      gateValue = strings.summaryHumanGateAccepted;
    } else if (summary.humanGateOutcome === "declined") {
      gateValue = strings.summaryHumanGateDeclined;
    }
    parts.push(`${strings.summaryHumanGate}: ${gateValue}`);
  }
  if (summary.playbook) {
    parts.push(`${strings.summaryPlaybook}: ${summary.playbook}`);
  }
  if (summary.sessionProfile) {
    parts.push(`${strings.summarySession}: ${summary.sessionProfile}`);
  }
  if (summary.durationMs !== null && summary.durationMs !== undefined) {
    parts.push(
      `${strings.summaryDuration}: ${formatDuration(summary.durationMs, fallback)}`,
    );
  }
  return parts.length > 0 ? parts.join(" | ") : null;
}

export default function StageMSummaryCard({
  summary,
  strings,
  notAvailable,
}: {
  summary: StageMSummary | null;
  strings: CandidateDetailStrings["stageM"];
  notAvailable: string;
}) {
  if (!summary) return null;

  const context = buildContext(summary, strings, notAvailable);
  const generatedAt = safeTimestamp(summary.generatedAt ?? null, notAvailable);
  const captureDetails = buildCaptureDetails(summary, strings, notAvailable);

  return (
    <Stack gap={3} className="mt-4">
      <Stack gap={1} className="text-xs text-foreground/60">
        <div>
          {strings.summaryContext}: {context}
        </div>
        <div>
          {strings.summaryGeneratedAt}: {generatedAt}
        </div>
        {captureDetails ? (
          <div>
            {strings.summaryCapture}: {captureDetails}
          </div>
        ) : null}
      </Stack>
      <Grid cols={1} gap={3} className="md:grid-cols-5">
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryPriceRange}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatRange(summary.priceMin, summary.priceMax, notAvailable)}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryMedianPrice}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatEuro(summary.priceMedian, notAvailable)}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryReviewMedian}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {summary.reviewMedian !== null && summary.reviewMedian !== undefined
              ? formatNumber(summary.reviewMedian)
              : notAvailable}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summarySponsoredShare}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {summary.sponsoredShare !== null && summary.sponsoredShare !== undefined
              ? formatPercent(summary.sponsoredShare)
              : notAvailable}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summarySampleCount}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {summary.sampleCount ?? notAvailable}
          </div>
        </div>
      </Grid>
    </Stack>
  );
}
