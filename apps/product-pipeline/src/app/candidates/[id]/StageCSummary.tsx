"use client";

import { Grid } from "@acme/design-system/primitives";

import { formatCurrency, formatPercent } from "@/lib/format";

import type { StageCSummary } from "./stageCHelpers";
import type { CandidateDetailStrings } from "./types";

function formatCents(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    return formatCurrency(BigInt(value));
  } catch {
    return fallback;
  }
}

export default function StageCSummaryCard({
  summary,
  strings,
  notAvailable,
}: {
  summary: StageCSummary | null;
  strings: CandidateDetailStrings["stageC"];
  notAvailable: string;
}) {
  if (!summary) return null;

  return (
    <Grid cols={1} gap={3} className="mt-4 md:grid-cols-5">
      <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
        <div className="text-xs text-foreground/60">
          {strings.summaryNetRevenue}
        </div>
        <div className="mt-1 text-sm font-semibold">
          {formatCents(summary.netRevenuePerUnitCents, notAvailable)}
        </div>
      </div>
      <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
        <div className="text-xs text-foreground/60">
          {strings.summaryContribution}
        </div>
        <div className="mt-1 text-sm font-semibold">
          {formatCents(summary.contributionPerUnitCents, notAvailable)}
        </div>
      </div>
      <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
        <div className="text-xs text-foreground/60">
          {strings.summaryMargin}
        </div>
        <div className="mt-1 text-sm font-semibold">
          {summary.contributionMarginPct !== null &&
          summary.contributionMarginPct !== undefined
            ? formatPercent(summary.contributionMarginPct / 100)
            : notAvailable}
        </div>
      </div>
      <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
        <div className="text-xs text-foreground/60">
          {strings.summaryPayoutDelay}
        </div>
        <div className="mt-1 text-sm font-semibold">
          {summary.payoutDelayDays ?? notAvailable}
        </div>
      </div>
      <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
        <div className="text-xs text-foreground/60">
          {strings.summaryTotalContribution}
        </div>
        <div className="mt-1 text-sm font-semibold">
          {formatCents(summary.totalContributionCents, notAvailable)}
        </div>
      </div>
    </Grid>
  );
}
