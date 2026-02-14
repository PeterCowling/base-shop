/* eslint-disable ds/no-hardcoded-copy -- non-user-facing stage/status literals and data-cy selectors [BOS-422] */
"use client";

import { useTranslations } from "@acme/i18n";
import type { GrowthLedger, GrowthLedgerStatus } from "@acme/lib";

type OverallStatus = "green" | "yellow" | "red";
type GuardrailSignal = "scale" | "hold" | "kill";

interface GrowthLedgerCardProps {
  businessCode: string;
  ledger: GrowthLedger | null;
}

function isDecisionStatus(status: GrowthLedgerStatus): boolean {
  return status === "green" || status === "yellow" || status === "red";
}

function computeOverall(ledger: GrowthLedger): {
  overallStatus: OverallStatus;
  guardrailSignal: GuardrailSignal;
} {
  const stageEntries = Object.values(ledger.stages);
  const blockingStages = stageEntries.filter((stage) => {
    if (stage.policy.blocking_mode === "never") {
      return false;
    }

    if (stage.policy.blocking_mode === "after_valid") {
      return isDecisionStatus(stage.status);
    }

    return true;
  });

  let overallStatus: OverallStatus = "green";
  if (blockingStages.some((stage) => stage.status === "red")) {
    overallStatus = "red";
  } else if (
    blockingStages.some(
      (stage) =>
        stage.status === "yellow" ||
        stage.status === "insufficient_data" ||
        stage.status === "not_tracked",
    )
  ) {
    overallStatus = "yellow";
  }

  if (overallStatus === "green") {
    return { overallStatus, guardrailSignal: "scale" };
  }
  if (overallStatus === "yellow") {
    return { overallStatus, guardrailSignal: "hold" };
  }

  return { overallStatus, guardrailSignal: "kill" };
}

function statusClass(status: GrowthLedgerStatus): string {
  if (status === "green") return "bg-success-soft text-success-fg";
  if (status === "yellow") return "bg-warning-soft text-warning-fg";
  if (status === "red") return "bg-danger-soft text-danger-fg";
  if (status === "insufficient_data") return "bg-info-soft text-info-fg";
  return "bg-surface-2 text-muted-foreground";
}

function overallClass(status: OverallStatus): string {
  if (status === "green") return "bg-success-soft text-success-fg";
  if (status === "yellow") return "bg-warning-soft text-warning-fg";
  return "bg-danger-soft text-danger-fg";
}

export function GrowthLedgerCard({ businessCode, ledger }: GrowthLedgerCardProps) {
  const t = useTranslations();

  if (!ledger) {
    return (
      <section
        className="rounded-lg border border-border-2 bg-card p-4 shadow-sm"
        data-cy="growth-ledger-card-empty"
      >
        <h2 className="text-lg font-semibold text-foreground">
          {t("businessOs.growthLedger.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("businessOs.growthLedger.empty", { businessCode })}
        </p>
      </section>
    );
  }

  const { overallStatus, guardrailSignal } = computeOverall(ledger);
  const stages: Array<keyof GrowthLedger["stages"]> = [
    "acquisition",
    "activation",
    "revenue",
    "retention",
    "referral",
  ];

  return (
    <section
      className="rounded-lg border border-border-2 bg-card p-4 shadow-sm"
      data-cy="growth-ledger-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {t("businessOs.growthLedger.title")}
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded px-2 py-1 text-xs font-semibold uppercase ${overallClass(overallStatus)}`}
            data-cy="growth-ledger-overall-status"
          >
            {overallStatus}
          </span>
          <span
            className="inline-flex rounded bg-surface-2 px-2 py-1 text-xs font-semibold uppercase text-foreground"
            data-cy="growth-ledger-guardrail-signal"
          >
            {guardrailSignal}
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {t("businessOs.growthLedger.updated", {
          date: new Date(ledger.updated_at).toLocaleString(),
        })}
      </p>

      <div className="mt-4 space-y-2">
        {stages.map((stage) => (
          <div
            key={stage}
            className="rounded border border-border-2 bg-surface-1 p-2"
            data-cy={`growth-stage-${stage}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                {stage}
              </span>
              <span
                className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusClass(ledger.stages[stage].status)}`}
              >
                {ledger.stages[stage].status}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("businessOs.growthLedger.policyLabel")}: {ledger.stages[stage].policy.blocking_mode}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
