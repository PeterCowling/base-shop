import { Cluster, Grid, Inline, Stack } from "@acme/design-system/primitives";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

import MetricCard from "@/components/MetricCard";
import PageHeader from "@/components/PageHeader";

export default async function HomePage() {
  const t = await getTranslations("en");
  const metrics = [
    {
      label: t("pipeline.home.metrics.leads.label"),
      value: t("pipeline.home.metrics.leads.value"),
      hint: t("pipeline.home.metrics.leads.hint"),
    },
    {
      label: t("pipeline.home.metrics.candidates.label"),
      value: t("pipeline.home.metrics.candidates.value"),
      hint: t("pipeline.home.metrics.candidates.hint"),
    },
    {
      label: t("pipeline.home.metrics.capital.label"),
      value: t("pipeline.home.metrics.capital.value"),
      hint: t("pipeline.home.metrics.capital.hint"),
    },
    {
      label: t("pipeline.home.metrics.payback.label"),
      value: t("pipeline.home.metrics.payback.value"),
      hint: t("pipeline.home.metrics.payback.hint"),
    },
  ];

  const stageStatus = [
    {
      stage: "P",
      name: t("pipeline.home.stageRail.stage.preSelection"),
      status: t("pipeline.home.stageRail.state.running"),
      count: 48,
    },
    {
      stage: "M",
      name: t("pipeline.home.stageRail.stage.marketVelocity"),
      status: t("pipeline.home.stageRail.state.queued"),
      count: 18,
    },
    {
      stage: "S",
      name: t("pipeline.home.stageRail.stage.safetyFeasibility"),
      status: t("pipeline.home.stageRail.state.inReview"),
      count: 9,
    },
    {
      stage: "K",
      name: t("pipeline.home.stageRail.stage.capitalTimeline"),
      status: t("pipeline.home.stageRail.state.ready"),
      count: 12,
    },
  ];

  const budgets = [
    { label: t("pipeline.home.budgets.leadIngest"), value: 40 },
    { label: t("pipeline.home.budgets.triageScans"), value: 40 },
    { label: t("pipeline.home.budgets.promotions"), value: 6 },
    { label: t("pipeline.home.budgets.deepEval"), value: 4 },
  ];

  const actionItems = [
    t("pipeline.home.actions.items.stageP"),
    t("pipeline.home.actions.items.enqueue"),
    t("pipeline.home.actions.items.suppliers"),
    t("pipeline.home.actions.items.audit"),
  ];

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.home.badge")}
        title={t("pipeline.home.title")}
        subtitle={t("pipeline.home.subtitle")}
      />

      <Grid cols={1} gap={4} className="md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
          />
        ))}
      </Grid>

      <Grid cols={1} gap={6} className="lg:grid-cols-3">
        <div className="pp-card p-6 lg:col-span-2">
          <Cluster justify="between" alignY="start" className="gap-4">
            <Stack gap={2}>
              <span className="text-xs uppercase tracking-widest text-foreground/60">
                {t("pipeline.home.stageRail.label")}
              </span>
              <h2 className="text-xl font-semibold tracking-tight">
                {t("pipeline.home.stageRail.title")}
              </h2>
            </Stack>
            <span className="pp-chip">{t("pipeline.home.stageRail.status.live")}</span>
          </Cluster>
          <Stack gap={4} className="mt-6">
            {stageStatus.map((stage) => (
              <Cluster
                key={stage.stage}
                justify="between"
                alignY="center"
                className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3"
              >
                <Inline gap={3} alignY="center" className="min-w-0">
                  <span className="rounded-full border border-border-2 px-2 py-1 text-xs font-semibold uppercase text-foreground/70">
                    {stage.stage}
                  </span>
                  <Stack gap={1} className="min-w-0">
                    <span className="text-sm font-semibold">{stage.name}</span>
                    <span className="text-xs text-foreground/60">
                      {stage.status}
                    </span>
                  </Stack>
                </Inline>
                <span className="text-sm font-semibold">
                  {t("pipeline.home.stageRail.count", { count: stage.count })}
                </span>
              </Cluster>
            ))}
          </Stack>
        </div>

        <div className="pp-card p-6">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {t("pipeline.home.budgets.label")}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("pipeline.home.budgets.title")}
            </h2>
          </Stack>
          <Stack gap={3} className="mt-4 text-sm">
            {budgets.map((budget) => (
              <Cluster key={budget.label} justify="between" alignY="center">
                <span className="text-foreground/70">{budget.label}</span>
                <span className="font-semibold">{budget.value}</span>
              </Cluster>
            ))}
          </Stack>
          <div className="mt-6 rounded-2xl border border-border-1 bg-surface-2 p-4 text-xs text-foreground/60">
            {t("pipeline.home.budgets.note")}
          </div>
        </div>
      </Grid>

      <section className="pp-card p-6">
        <Cluster justify="between" alignY="center" className="flex-col gap-4 lg:flex-row">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {t("pipeline.home.actions.label")}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("pipeline.home.actions.title")}
            </h2>
          </Stack>
          <button className="min-h-12 min-w-12 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            {t("pipeline.home.actions.button")}
          </button>
        </Cluster>
        <Grid cols={1} gap={4} className="mt-6 md:grid-cols-2">
          {actionItems.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-sm"
            >
              {item}
            </div>
          ))}
        </Grid>
      </section>
    </Stack>
  );
}
