import Link from "next/link";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { Grid, Stack } from "@acme/design-system/primitives";

import PageHeader from "@/components/PageHeader";

import LeadsClient from "./LeadsClient";

export default async function LeadsPage() {
  const t = await getTranslations("en");
  const strings = {
    intakeLabel: t("pipeline.leads.section.intake.label"),
    intakeTitle: t("pipeline.leads.section.intake.title"),
    runStagePLabel: t("pipeline.leads.actions.runStageP"),
    promoteTopLabel: t("pipeline.leads.actions.promoteTop"),
    exportCsvLabel: t("pipeline.leads.actions.exportCsv"),
    leadLabel: t("pipeline.leads.fields.lead"),
    urlLabel: t("pipeline.leads.fields.url"),
    submitLabel: t("pipeline.leads.actions.submitLead"),
    table: {
      select: t("pipeline.leads.table.select"),
      id: t("pipeline.leads.table.id"),
      lead: t("pipeline.leads.table.lead"),
      source: t("pipeline.leads.table.source"),
      triage: t("pipeline.leads.table.triage"),
      score: t("pipeline.leads.table.score"),
      status: t("pipeline.leads.table.status"),
    },
    notAvailable: t("pipeline.common.notAvailable"),
  };

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
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {t("pipeline.leads.triageLink.label")}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("pipeline.leads.triageLink.title")}
          </h2>
        </Stack>
        <div className="mt-3 text-sm text-foreground/70">
          {t("pipeline.leads.triageLink.body")}
        </div>
        <div className="mt-4">
          <Link
            className="rounded-full border border-border-2 px-4 py-2 text-xs font-semibold"
            href="/leads/triage"
          >
            {t("pipeline.leads.triageLink.action")}
          </Link>
        </div>
      </section>

      <LeadsClient strings={strings} />

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
