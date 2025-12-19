import PageHeader from "@/components/PageHeader";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { Cluster, Stack } from "@ui/components/atoms/primitives";

export default async function LaunchesPage() {
  const t = await getTranslations("en");
  const launches = [
    {
      id: "PL-12",
      title: t("pipeline.launches.items.pl12.title"),
      status: t("pipeline.launches.items.pl12.status"),
      variance: t("pipeline.launches.items.pl12.variance"),
    },
    {
      id: "PL-14",
      title: t("pipeline.launches.items.pl14.title"),
      status: t("pipeline.launches.items.pl14.status"),
      variance: t("pipeline.launches.items.pl14.variance"),
    },
  ];

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.launches.badge")}
        title={t("pipeline.launches.title")}
        subtitle={t("pipeline.launches.subtitle")}
      />

      <section className="pp-card p-6">
        <Cluster justify="between" alignY="center" className="gap-4">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {t("pipeline.launches.section.label")}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("pipeline.launches.section.title")}
            </h2>
          </Stack>
          <button className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            {t("pipeline.launches.actions.ingest")}
          </button>
        </Cluster>
        <Stack gap={4} className="mt-6">
          {launches.map((launch) => (
            <div
              key={launch.id}
              className="rounded-3xl border border-border-1 bg-surface-2 p-4"
            >
              <div className="text-xs text-foreground/60">
                {launch.id}
              </div>
              <div className="text-lg font-semibold">{launch.title}</div>
              <div className="mt-2 text-sm text-foreground/70">
                {launch.status}
              </div>
              <div className="mt-2 text-xs text-foreground/60">
                {t("pipeline.launches.fields.variance")}: {launch.variance}
              </div>
            </div>
          ))}
        </Stack>
      </section>
    </Stack>
  );
}
