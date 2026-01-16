"use client";

import { Grid } from "@acme/ui/components/atoms/primitives";
import { formatNumber } from "@/lib/format";
import type { CandidateDetailStrings } from "./types";
import type { StageSSummary } from "./stageSHelpers";

export default function StageSSummaryCard({
  summary,
  strings,
  notAvailable,
}: {
  summary: StageSSummary | null;
  strings: CandidateDetailStrings["stageS"];
  notAvailable: string;
}) {
  if (!summary) return null;

  const overallRisk = summary.overallRisk ?? null;
  const action = summary.action ?? null;
  const actionLabel =
    action === "ADVANCE"
      ? strings.actions.advance
      : action === "REVIEW"
        ? strings.actions.review
        : action === "BLOCK"
          ? strings.actions.block
          : notAvailable;
  const riskLabel =
    overallRisk === "high"
      ? strings.riskBands.high
      : overallRisk === "medium"
        ? strings.riskBands.medium
        : overallRisk === "low"
          ? strings.riskBands.low
          : notAvailable;
  const matchingLabel =
    summary.matchingConfidence !== null &&
    summary.matchingConfidence !== undefined
      ? `${formatNumber(summary.matchingConfidence)}%`
      : notAvailable;
  const flags =
    summary.flaggedCategories?.length && summary.flaggedCategories.length > 0
      ? summary.flaggedCategories.join(", ")
      : notAvailable;

  return (
    <>
      <Grid cols={1} gap={3} className="mt-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryOverallRisk}
          </div>
          <div className="mt-1 text-sm font-semibold">{riskLabel}</div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryScore}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {summary.feasibilityScore ?? notAvailable}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryMatchingConfidence}
          </div>
          <div className="mt-1 text-sm font-semibold">{matchingLabel}</div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryAction}
          </div>
          <div className="mt-1 text-sm font-semibold">{actionLabel}</div>
        </div>
      </Grid>
      <div className="mt-3 text-xs text-foreground/60">
        {strings.summaryFlags}: {flags}
      </div>
    </>
  );
}
