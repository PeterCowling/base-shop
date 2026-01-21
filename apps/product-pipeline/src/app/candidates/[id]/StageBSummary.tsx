"use client";

import { Grid } from "@acme/ui/components/atoms/primitives";

import { formatCurrency } from "@/lib/format";

import type { StageBSummary } from "./stageBHelpers";
import type { CandidateDetailStrings } from "./types";

function formatCents(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    return formatCurrency(BigInt(value));
  } catch {
    return fallback;
  }
}

export default function StageBSummaryCard({
  summary,
  strings,
  notAvailable,
}: {
  summary: StageBSummary | null;
  strings: CandidateDetailStrings["stageB"];
  notAvailable: string;
}) {
  if (!summary) return null;

  const depositLabel =
    summary.depositPct !== null && summary.depositPct !== undefined
      ? `${summary.depositPct.toFixed(0)}%`
      : notAvailable;

  return (
    <>
      <Grid cols={1} gap={3} className="mt-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryUnitCost}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatCents(summary.perUnitLandedCostCents, notAvailable)}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryTotalCost}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatCents(summary.totalLandedCostCents, notAvailable)}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryDeposit}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatCents(summary.depositAmountCents, notAvailable)}{" "}
            <span className="text-xs text-foreground/60">{depositLabel}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryBalance}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatCents(summary.balanceAmountCents, notAvailable)}
          </div>
        </div>
      </Grid>
      <div className="mt-3 text-xs text-foreground/60">
        {strings.summaryLeadTime}:{" "}
        {summary.leadTimeDays ?? notAvailable}
        {summary.balanceDueDay !== null &&
        summary.balanceDueDay !== undefined
          ? ` · ${summary.balanceDueDay}`
          : ""}
      </div>
    </>
  );
}
