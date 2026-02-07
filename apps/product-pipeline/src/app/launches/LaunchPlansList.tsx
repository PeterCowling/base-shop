"use client";

import { Cluster, Grid, Stack } from "@acme/design-system/primitives";

import { formatNumber, formatPercent } from "@/lib/format";

import type { LaunchesStrings,LaunchPlan } from "./types";

export default function LaunchPlansList({
  plans,
  loading,
  strings,
}: {
  plans: LaunchPlan[];
  loading: boolean;
  strings: LaunchesStrings;
}) {
  return (
    <section className="pp-card p-6">
      <Cluster justify="between" alignY="center" className="gap-4">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.plansLabel}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {strings.plansTitle}
          </h2>
        </Stack>
      </Cluster>
      <Stack gap={4} className="mt-6">
        {loading ? (
          <div className="rounded-3xl border border-border-1 bg-surface-2 p-4">
            <div className="h-4 w-24 rounded-full bg-foreground/10" />
            <div className="mt-3 h-5 w-48 rounded-full bg-foreground/10" />
            <div className="mt-4 h-3 w-32 rounded-full bg-foreground/10" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-sm text-foreground/70">
            {strings.emptyLabel}
          </div>
        ) : (
          plans.map((plan) => {
            const variance = plan.actuals?.variancePct ?? null;
            const priorVelocity = plan.velocityPrior?.velocityPerDay ?? null;
            const priorSource = plan.velocityPrior?.source ?? null;
            const decisionValue = plan.decision?.decision ?? null;
            const decisionLabel =
              decisionValue === "SCALE"
                ? strings.decisionLabels.scale
                : decisionValue === "KILL"
                  ? strings.decisionLabels.kill
                  : decisionValue ?? strings.notAvailable;
            const statusLabel =
              plan.status === "PLANNED"
                ? strings.statusLabels.planned
                : plan.status === "PILOT"
                  ? strings.statusLabels.pilot
                  : plan.status === "ACTUALS_INGESTED"
                    ? strings.statusLabels.ingested
                    : plan.status;
            return (
              <div
                key={plan.id}
                className="rounded-3xl border border-border-1 bg-surface-2 p-4"
              >
                <div className="text-xs text-foreground/60">{plan.id}</div>
                <div className="text-lg font-semibold">
                  {plan.lead?.title ?? strings.notAvailable}
                </div>
                <Grid cols={1} gap={3} className="mt-3 md:grid-cols-2">
                  <div className="text-sm text-foreground/70">
                    {strings.fields.status}: {statusLabel}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.plannedUnits}:{" "}
                    {plan.plannedUnits ?? strings.notAvailable}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.plannedUnitsPerDay}:{" "}
                    {plan.plannedUnitsPerDay ?? strings.notAvailable}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.actualVelocity}:{" "}
                    {plan.actuals?.velocityPerDay !== null &&
                    plan.actuals?.velocityPerDay !== undefined
                      ? formatNumber(plan.actuals.velocityPerDay)
                      : strings.notAvailable}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.velocityPrior}:{" "}
                    {priorVelocity !== null && priorVelocity !== undefined
                      ? formatNumber(priorVelocity)
                      : strings.notAvailable}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.velocityPriorSource}:{" "}
                    {priorSource ?? strings.notAvailable}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.variance}:{" "}
                    {variance !== null && variance !== undefined
                      ? formatPercent(variance)
                      : strings.notAvailable}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.decision}: {decisionLabel}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.decisionAt}:{" "}
                    {plan.decision?.decidedAt ?? strings.notAvailable}
                  </div>
                  <div className="text-sm text-foreground/70">
                    {strings.fields.decisionBy}:{" "}
                    {plan.decision?.decidedBy ?? strings.notAvailable}
                  </div>
                </Grid>
                {plan.decision?.notes ? (
                  <div className="mt-3 text-sm text-foreground/70">
                    {strings.fields.decisionNotes}: {plan.decision.notes}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </Stack>
    </section>
  );
}
