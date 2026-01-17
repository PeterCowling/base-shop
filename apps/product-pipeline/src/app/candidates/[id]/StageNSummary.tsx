"use client";

import { Grid, Stack } from "@acme/ui/components/atoms/primitives";
import { formatCurrency } from "@/lib/format";
import type { CandidateDetailStrings, StageNNegotiationStatus } from "./types";
import type { StageNSummary } from "./stageNHelpers";

function formatCents(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    return formatCurrency(BigInt(value));
  } catch {
    return fallback;
  }
}

function resolveStatusLabel(
  status: StageNNegotiationStatus | null | undefined,
  labels: CandidateDetailStrings["stageN"]["statuses"],
  fallback: string,
): string {
  if (!status) return fallback;
  switch (status) {
    case "not_started":
      return labels.notStarted;
    case "in_progress":
      return labels.inProgress;
    case "waiting_on_supplier":
      return labels.waitingOnSupplier;
    case "terms_improved":
      return labels.termsImproved;
    case "no_progress":
      return labels.noProgress;
    default:
      return fallback;
  }
}

export default function StageNSummaryCard({
  summary,
  strings,
  notAvailable,
}: {
  summary: StageNSummary | null;
  strings: CandidateDetailStrings["stageN"];
  notAvailable: string;
}) {
  if (!summary) return null;

  const statusLabel = resolveStatusLabel(
    summary.status ?? null,
    strings.statuses,
    notAvailable,
  );

  return (
    <>
      <Grid cols={1} gap={3} className="mt-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryStatus}
          </div>
          <div className="mt-1 text-sm font-semibold">{statusLabel}</div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summarySupplier}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {summary.supplierName ?? notAvailable}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryTargetUnitCost}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatCents(summary.targetUnitCostCents, notAvailable)}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.summaryTargetMoq}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {summary.targetMoq ?? notAvailable}
          </div>
        </div>
      </Grid>
      <div className="mt-3 text-xs text-foreground/60">
        {strings.summaryLeadTime}: {summary.targetLeadTimeDays ?? notAvailable} ·
        {" "}
        {strings.summaryDeposit}: {summary.targetDepositPct ?? notAvailable}
        {summary.targetDepositPct !== null &&
        summary.targetDepositPct !== undefined
          ? "%"
          : ""}
        {" "}· {strings.summaryPaymentTerms}: {summary.targetPaymentTerms ?? notAvailable}
        {" "}· {strings.summaryIncoterms}: {summary.targetIncoterms ?? notAvailable}
      </div>
      <div className="mt-4 rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-sm">
        <div className="text-xs text-foreground/60">
          {strings.summaryTasks}
        </div>
        {summary.tasks && summary.tasks.length > 0 ? (
          <Stack gap={1} className="mt-2 text-xs text-foreground/70">
            {summary.tasks.map((task, index) => (
              <div key={`${task}-${index}`}>{task}</div>
            ))}
          </Stack>
        ) : (
          <div className="mt-2 text-xs text-foreground/60">
            {strings.summaryTasksEmpty}
          </div>
        )}
      </div>
    </>
  );
}
