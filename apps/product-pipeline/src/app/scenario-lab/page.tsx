import PageHeader from "@/components/PageHeader";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import {
  computeSensitivities,
  computeStageK,
  money,
  type StageKInput,
} from "@acme/pipeline-engine";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { Cluster, Grid, Stack } from "@ui/components/atoms/primitives";

const horizonDays = 120;
const unitsPlanned = 500;
const unitsSoldByDay = Array.from({ length: horizonDays + 1 }, (_, day) =>
  Math.min(unitsPlanned, Math.round(day * 5.2)),
);

const baseInput: StageKInput = {
  horizonDays,
  cashflows: [
    { day: 0, amountCents: money.fromEuros(-68000) },
    { day: 18, amountCents: money.fromEuros(-6400) },
    { day: 30, amountCents: money.fromEuros(22000) },
    { day: 45, amountCents: money.fromEuros(28000) },
    { day: 60, amountCents: money.fromEuros(22000) },
    { day: 85, amountCents: money.fromEuros(18000) },
  ],
  unitsPlanned,
  unitsSoldByDay,
  sellThroughTargetPct: 0.8,
  salvageValueCents: money.fromEuros(2800),
};

const result = computeStageK(baseInput);
const sensitivities = computeSensitivities({
  baseInput,
  definitions: [
    {
      label: "pipeline.scenario.sensitivities.price",
      delta: 1,
      apply: (input, delta) => ({
        ...input,
        cashflows: input.cashflows.map((flow) => ({
          ...flow,
          amountCents:
            flow.day >= 30 ? flow.amountCents + money.fromEuros(delta * 700) : flow.amountCents,
        })),
      }),
    },
    {
      label: "pipeline.scenario.sensitivities.freight",
      delta: 1,
      apply: (input, delta) => ({
        ...input,
        cashflows: input.cashflows.map((flow) => ({
          ...flow,
          amountCents:
            flow.day === 18
              ? flow.amountCents - money.fromEuros(delta * 450)
              : flow.amountCents,
        })),
      }),
    },
    {
      label: "pipeline.scenario.sensitivities.velocity",
      delta: 1,
      apply: (input, delta) => ({
        ...input,
        unitsSoldByDay: input.unitsSoldByDay.map((value) =>
          Math.min(unitsPlanned, Math.round(value * (1 + delta * 0.08))),
        ),
      }),
    },
  ],
});

export default async function ScenarioLabPage() {
  const t = await getTranslations("en");
  const paybackLabel =
    result.paybackDay === null || result.paybackDay === undefined
      ? t("pipeline.common.notAvailable")
      : t("pipeline.scenario.outputs.days", { count: result.paybackDay });

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.scenario.badge")}
        title={t("pipeline.scenario.title")}
        subtitle={t("pipeline.scenario.subtitle")}
      />

      <Grid cols={1} gap={4} className="lg:grid-cols-3">
        <div className="pp-card p-6 lg:col-span-2">
          <Cluster justify="between" alignY="start" className="gap-4">
            <Stack gap={2}>
              <span className="text-xs uppercase tracking-widest text-foreground/60">
                {t("pipeline.scenario.base.label")}
              </span>
              <h2 className="text-xl font-semibold tracking-tight">
                {t("pipeline.scenario.base.title")}
              </h2>
            </Stack>
            <span className="pp-chip">{t("pipeline.scenario.base.badge")}</span>
          </Cluster>
          <Grid cols={1} gap={4} className="mt-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
              <div className="text-xs text-foreground/60">
                {t("pipeline.scenario.outputs.peakCash")}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {formatCurrency(result.peakCashOutlayCents)}
              </div>
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
              <div className="text-xs text-foreground/60">
                {t("pipeline.scenario.outputs.payback")}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {paybackLabel}
              </div>
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
              <div className="text-xs text-foreground/60">
                {t("pipeline.scenario.outputs.capitalDays")}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {formatNumber(result.capitalDaysEurosDays)}
              </div>
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
              <div className="text-xs text-foreground/60">
                {t("pipeline.scenario.outputs.annualizedReturn")}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {formatPercent(result.annualizedCapitalReturnRate)}
              </div>
            </div>
          </Grid>
        </div>

        <div className="pp-card p-6">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {t("pipeline.scenario.controls.label")}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("pipeline.scenario.controls.title")}
            </h2>
          </Stack>
          <Stack gap={4} className="mt-4 text-sm text-foreground/70">
            <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
              {t("pipeline.scenario.controls.items.pricing")}
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
              {t("pipeline.scenario.controls.items.leadTime")}
            </div>
            <button className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground">
              {t("pipeline.scenario.controls.action")}
            </button>
          </Stack>
        </div>
      </Grid>

      <section className="pp-card p-6">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {t("pipeline.scenario.sensitivities.label")}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("pipeline.scenario.sensitivities.title")}
          </h2>
        </Stack>
        <Grid cols={1} gap={4} className="mt-6 md:grid-cols-3">
          {Object.entries(sensitivities).map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-border-1 bg-surface-2 p-4"
            >
              <div className="text-xs text-foreground/60">{t(label)}</div>
              <div className="mt-2 text-xl font-semibold">
                {formatPercent(value)}
              </div>
              <div className="mt-1 text-xs text-foreground/60">
                {t("pipeline.scenario.sensitivities.unit")}
              </div>
            </div>
          ))}
        </Grid>
      </section>
    </Stack>
  );
}
