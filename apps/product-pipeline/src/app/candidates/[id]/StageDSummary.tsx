"use client";

import { Grid } from "@ui/components/atoms/primitives";
import { formatCurrency } from "@/lib/format";
import type { CandidateDetailStrings, StageDAssetReadiness } from "./types";
import type { StageDSummary } from "./stageDHelpers";

function formatCents(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    return formatCurrency(BigInt(value));
  } catch {
    return fallback;
  }
}

function resolveReadinessLabel(
  readiness: StageDAssetReadiness | null | undefined,
  labels: CandidateDetailStrings["stageD"]["assetReadiness"],
  fallback: string,
): string {
  if (!readiness) return fallback;
  switch (readiness) {
    case "not_started":
      return labels.notStarted;
    case "in_progress":
      return labels.inProgress;
    case "ready":
      return labels.ready;
    default:
      return fallback;
  }
}

export default function StageDSummaryCard({
  summary,
  strings,
  notAvailable,
}: {
  summary: StageDSummary | null;
  strings: CandidateDetailStrings["stageD"];
  notAvailable: string;
}) {
  if (!summary) return null;

  const readinessLabel = resolveReadinessLabel(
    summary.assetReadiness ?? null,
    strings.assetReadiness,
    notAvailable,
  );

  return (
    <>
      <Grid cols={1} gap={3} className="mt-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryAssetReadiness}
          </div>
          <div className="mt-1 text-sm font-semibold">{readinessLabel}</div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryOneTimeCost}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatCents(summary.oneTimeCostCents, notAvailable)}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summarySamplingRounds}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {summary.samplingRounds ?? notAvailable}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryLeadTime}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {summary.leadTimeDays ?? notAvailable}
          </div>
        </div>
      </Grid>
      <div className="mt-3 text-xs text-foreground/60">
        {strings.summaryPackagingStatus}: {summary.packagingStatus ?? notAvailable}
      </div>
    </>
  );
}
