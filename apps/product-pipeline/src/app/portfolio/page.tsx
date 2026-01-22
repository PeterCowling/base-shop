import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { Grid, Stack } from "@acme/design-system/primitives";

import PageHeader from "@/components/PageHeader";

export default async function PortfolioPage() {
  const t = await getTranslations("en");
  const constraints = [
    {
      label: t("pipeline.portfolio.constraints.cash.label"),
      value: t("pipeline.portfolio.constraints.cash.value"),
    },
    {
      label: t("pipeline.portfolio.constraints.hours.label"),
      value: t("pipeline.portfolio.constraints.hours.value"),
    },
    {
      label: t("pipeline.portfolio.constraints.pilots.label"),
      value: t("pipeline.portfolio.constraints.pilots.value"),
    },
  ];

  const recommendations = [
    t("pipeline.portfolio.recommendations.items.allocate"),
    t("pipeline.portfolio.recommendations.items.hold"),
    t("pipeline.portfolio.recommendations.items.defer"),
  ];

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.portfolio.badge")}
        title={t("pipeline.portfolio.title")}
        subtitle={t("pipeline.portfolio.subtitle")}
      />

      <Grid cols={1} gap={4} className="md:grid-cols-3">
        {constraints.map((item) => (
          <div key={item.label} className="pp-card p-5">
            <div className="text-xs uppercase tracking-widest text-foreground/60">
              {item.label}
            </div>
            <div className="mt-3 text-2xl font-semibold">{item.value}</div>
          </div>
        ))}
      </Grid>

      <section className="pp-card p-6">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {t("pipeline.portfolio.recommendations.label")}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("pipeline.portfolio.recommendations.title")}
          </h2>
        </Stack>
        <Stack gap={3} className="mt-4 text-sm">
          {recommendations.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3"
            >
              {item}
            </div>
          ))}
        </Stack>
      </section>
    </Stack>
  );
}
