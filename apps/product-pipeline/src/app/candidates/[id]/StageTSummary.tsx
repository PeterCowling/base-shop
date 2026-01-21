"use client";

import { Grid } from "@acme/ui/components/atoms/primitives";

import type { StageTSummary } from "./stageTHelpers";
import type { CandidateDetailStrings } from "./types";

export default function StageTSummaryCard({
  summary,
  strings,
  notAvailable,
}: {
  summary: StageTSummary | null;
  strings: CandidateDetailStrings["stageT"];
  notAvailable: string;
}) {
  if (!summary) return null;

  const decision = summary.decision ?? null;
  const decisionLabel =
    decision === "allowed"
      ? strings.decisions.allowed
      : decision === "needs_review"
        ? strings.decisions.needsReview
        : decision === "blocked"
          ? strings.decisions.blocked
          : notAvailable;
  const action = summary.action ?? null;
  const actionLabel =
    action === "ADVANCE"
      ? strings.actions.advance
      : action === "REVIEW"
        ? strings.actions.review
        : action === "BLOCK"
          ? strings.actions.block
          : notAvailable;
  const evidenceCount =
    summary.requiredEvidenceCount !== null &&
    summary.requiredEvidenceCount !== undefined
      ? String(summary.requiredEvidenceCount)
      : notAvailable;
  const reasons =
    summary.reasonCodes?.length && summary.reasonCodes.length > 0
      ? summary.reasonCodes.join(", ")
      : notAvailable;
  const evidenceList =
    summary.requiredEvidence?.length && summary.requiredEvidence.length > 0
      ? summary.requiredEvidence.join(", ")
      : notAvailable;

  return (
    <>
      <Grid cols={1} gap={3} className="mt-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryDecision}
          </div>
          <div className="mt-1 text-sm font-semibold">{decisionLabel}</div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryAction}
          </div>
          <div className="mt-1 text-sm font-semibold">{actionLabel}</div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryEvidence}
          </div>
          <div className="mt-1 text-sm font-semibold">{evidenceCount}</div>
        </div>
      </Grid>
      <div className="mt-3 text-xs text-foreground/60">
        {strings.summaryReasons}: {reasons}
      </div>
      <div className="mt-2 text-xs text-foreground/60">
        {strings.summaryEvidenceList}: {evidenceList}
      </div>
    </>
  );
}
