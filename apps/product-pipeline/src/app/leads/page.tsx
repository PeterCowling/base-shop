import PageHeader from "@/components/PageHeader";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { Cluster, Grid, Stack } from "@ui/components/atoms/primitives";

export default async function LeadsPage() {
  const t = await getTranslations("en");
  const leads = [
    {
      id: "LD-1402",
      title: t("pipeline.leads.items.ld1402.title"),
      source: t("pipeline.leads.items.ld1402.source"),
      triage: t("pipeline.leads.items.ld1402.triage"),
      score: 78,
      status: t("pipeline.leads.items.ld1402.status"),
    },
    {
      id: "LD-1409",
      title: t("pipeline.leads.items.ld1409.title"),
      source: t("pipeline.leads.items.ld1409.source"),
      triage: t("pipeline.leads.items.ld1409.triage"),
      score: 61,
      status: t("pipeline.leads.items.ld1409.status"),
    },
    {
      id: "LD-1415",
      title: t("pipeline.leads.items.ld1415.title"),
      source: t("pipeline.leads.items.ld1415.source"),
      triage: t("pipeline.leads.items.ld1415.triage"),
      score: 82,
      status: t("pipeline.leads.items.ld1415.status"),
    },
    {
      id: "LD-1421",
      title: t("pipeline.leads.items.ld1421.title"),
      source: t("pipeline.leads.items.ld1421.source"),
      triage: t("pipeline.leads.items.ld1421.triage"),
      score: 45,
      status: t("pipeline.leads.items.ld1421.status"),
    },
  ];

  const triageSignals = [
    t("pipeline.leads.signals.items.demand"),
    t("pipeline.leads.signals.items.competition"),
    t("pipeline.leads.signals.items.effort"),
  ];

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.leads.badge")}
        title={t("pipeline.leads.title")}
        subtitle={t("pipeline.leads.subtitle")}
      />

      <section className="pp-card p-6">
        <Cluster justify="between" alignY="center" className="gap-4">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {t("pipeline.leads.section.intake.label")}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("pipeline.leads.section.intake.title")}
            </h2>
          </Stack>
          <Cluster gap={2} alignY="center">
            <button className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-sm">
              {t("pipeline.leads.actions.runStageP")}
            </button>
            <button className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              {t("pipeline.leads.actions.promoteTop")}
            </button>
          </Cluster>
        </Cluster>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border-1">
          <table className="pp-table">
            <thead>
              <tr>
                <th>{t("pipeline.leads.table.id")}</th>
                <th>{t("pipeline.leads.table.lead")}</th>
                <th>{t("pipeline.leads.table.source")}</th>
                <th>{t("pipeline.leads.table.triage")}</th>
                <th>{t("pipeline.leads.table.score")}</th>
                <th>{t("pipeline.leads.table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="font-mono text-xs text-foreground/70">
                    {lead.id}
                  </td>
                  <td className="font-semibold">{lead.title}</td>
                  <td className="text-sm text-foreground/70">
                    {lead.source}
                  </td>
                  <td>
                    <span className="rounded-full border border-border-2 px-2 py-1 text-xs">
                      {lead.triage}
                    </span>
                  </td>
                  <td className="font-semibold">{lead.score}</td>
                  <td>
                    <span className="text-xs text-foreground/60">
                      {lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pp-card p-6">
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {t("pipeline.leads.signals.label")}
        </span>
        <Grid cols={1} gap={4} className="mt-4 md:grid-cols-3">
          {triageSignals.map((signal) => (
            <div
              key={signal}
              className="rounded-2xl border border-border-1 bg-surface-2 p-4 text-sm"
            >
              {signal}
            </div>
          ))}
        </Grid>
      </section>
    </Stack>
  );
}
