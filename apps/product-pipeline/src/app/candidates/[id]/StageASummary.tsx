"use client";

import { Grid } from "@acme/ui/components/atoms/primitives";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { CandidateDetailStrings, StageAAction } from "./types";
import type { StageASummary } from "./stageAHelpers";

function formatCents(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    return formatCurrency(BigInt(value));
  } catch {
    return fallback;
  }
}

function resolveActionLabel(
  action: StageAAction | null | undefined,
  labels: CandidateDetailStrings["stageA"]["actions"],
  fallback: string,
): string {
  if (!action) return fallback;
  switch (action) {
    case "advance":
      return labels.advance;
    case "review":
      return labels.review;
    case "reject":
      return labels.reject;
    default:
      return fallback;
  }
}

export default function StageASummaryCard({
  summary,
  strings,
  notAvailable,
}: {
  summary: StageASummary | null;
  strings: CandidateDetailStrings["stageA"];
  notAvailable: string;
}) {
  if (!summary) return null;

  const actionLabel = resolveActionLabel(
    summary.action ?? null,
    strings.actions,
    notAvailable,
  );

  return (
    <Grid cols={1} gap={3} className="mt-4 md:grid-cols-4">
      <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
        <div className="text-xs text-foreground/60">
          {strings.summaryMargin}
        </div>
        <div className="mt-1 text-sm font-semibold">
          {summary.marginPct !== null && summary.marginPct !== undefined
            ? formatPercent(summary.marginPct / 100)
            : notAvailable}
        </div>
      </div>
      <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
        <div className="text-xs text-foreground/60">
          {strings.summaryNetPerUnit}
        </div>
        <div className="mt-1 text-sm font-semibold">
          {formatCents(summary.netPerUnitCents, notAvailable)}
        </div>
      </div>
      <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
        <div className="text-xs text-foreground/60">
          {strings.summaryThreshold}
        </div>
        <div className="mt-1 text-sm font-semibold">
          {summary.targetMarginPct !== null && summary.targetMarginPct !== undefined
            ? formatPercent(summary.targetMarginPct / 100)
            : notAvailable}
        </div>
      </div>
      <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
        <div className="text-xs text-foreground/60">
          {strings.summaryAction}
        </div>
        <div className="mt-1 text-sm font-semibold">{actionLabel}</div>
      </div>
    </Grid>
  );
}
