import PageHeader from "@/components/PageHeader";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { Grid, Stack } from "@acme/ui/components/atoms/primitives";
import CandidatesClient from "./CandidatesClient";

export default async function CandidatesPage() {
  const t = await getTranslations("en");
  const strings = {
    rankedLabel: t("pipeline.candidates.section.ranked.label"),
    rankedTitle: t("pipeline.candidates.section.ranked.title"),
    runStageKLabel: t("pipeline.candidates.actions.runStageK"),
    exportCsvLabel: t("pipeline.candidates.actions.exportCsv"),
    selectAllLabel: t("pipeline.candidates.table.selectAll"),
    selectLabel: t("pipeline.candidates.table.select"),
    stageLabel: t("pipeline.candidates.fields.stage"),
    returnBandLabel: t("pipeline.candidates.fields.returnBand"),
    peakCashLabel: t("pipeline.candidates.fields.peakCash"),
    paybackLabel: t("pipeline.candidates.fields.payback"),
    riskLabel: t("pipeline.candidates.tags.risk"),
    effortLabel: t("pipeline.candidates.tags.effort"),
    nextLabel: t("pipeline.candidates.tags.nextLabel"),
    nextActions: {
      advance: t("pipeline.candidates.nextActions.advance"),
      reviewRisk: t("pipeline.candidates.nextActions.reviewRisk"),
      reviewEffort: t("pipeline.candidates.nextActions.reviewEffort"),
      needStageK: t("pipeline.candidates.nextActions.needStageK"),
    },
    bulk: {
      running: t("pipeline.candidates.bulk.running"),
      progress: t("pipeline.candidates.bulk.progress"),
      complete: t("pipeline.candidates.bulk.complete"),
      error: t("pipeline.candidates.bulk.error"),
      noneSelected: t("pipeline.candidates.bulk.noneSelected"),
    },
    notAvailable: t("pipeline.common.notAvailable"),
  };

  const compareItems = [
    t("pipeline.candidates.section.compare.items.price"),
    t("pipeline.candidates.section.compare.items.freight"),
    t("pipeline.candidates.section.compare.items.leadTime"),
  ];

  const decisionItems = [
    t("pipeline.candidates.section.decisions.items.negotiation"),
    t("pipeline.candidates.section.decisions.items.eligibility"),
    t("pipeline.candidates.section.decisions.items.hazmat"),
  ];

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.candidates.badge")}
        title={t("pipeline.candidates.title")}
        subtitle={t("pipeline.candidates.subtitle")}
      />

      <CandidatesClient strings={strings} />

      <Grid cols={1} gap={4} className="md:grid-cols-2">
        <div className="pp-card p-6">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {t("pipeline.candidates.section.compare.label")}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("pipeline.candidates.section.compare.title")}
            </h2>
          </Stack>
          <Stack gap={3} className="mt-4 text-sm text-foreground/70">
            {compareItems.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </Stack>
        </div>
        <div className="pp-card p-6">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {t("pipeline.candidates.section.decisions.label")}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("pipeline.candidates.section.decisions.title")}
            </h2>
          </Stack>
          <Stack gap={3} className="mt-4 text-sm">
            {decisionItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3"
              >
                {item}
              </div>
            ))}
          </Stack>
        </div>
      </Grid>
    </Stack>
  );
}
