import PageHeader from "@/components/PageHeader";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { Grid, Stack } from "@ui/components/atoms/primitives";
import CandidatesClient from "./CandidatesClient";

export default async function CandidatesPage() {
  const t = await getTranslations("en");
  const strings = {
    rankedLabel: t("pipeline.candidates.section.ranked.label"),
    rankedTitle: t("pipeline.candidates.section.ranked.title"),
    runFullEvalLabel: t("pipeline.candidates.actions.runFullEval"),
    runStageKLabel: t("pipeline.candidates.actions.runStageK"),
    exportCsvLabel: t("pipeline.candidates.actions.exportCsv"),
    viewCandidateLabel: t("pipeline.candidates.actions.viewCandidate"),
    selectAllLabel: t("pipeline.candidates.table.selectAll"),
    selectLabel: t("pipeline.candidates.table.select"),
    stageLabel: t("pipeline.candidates.fields.stage"),
    profitLabel: t("pipeline.candidates.fields.profit"),
    peakCashLabel: t("pipeline.candidates.fields.peakCash"),
    paybackLabel: t("pipeline.candidates.fields.payback"),
    riskLabel: t("pipeline.candidates.tags.risk"),
    effortLabel: t("pipeline.candidates.tags.effort"),
    nextLabel: t("pipeline.candidates.tags.nextLabel"),
    recommendation: {
      label: t("pipeline.candidates.recommendation.label"),
      advance: t("pipeline.candidates.recommendation.advance"),
      review: t("pipeline.candidates.recommendation.review"),
      reject: t("pipeline.candidates.recommendation.reject"),
      pause: t("pipeline.candidates.recommendation.pause"),
    },
    nextSteps: {
      needStageM: t("pipeline.candidate.hud.nextActions.needStageM"),
      needStageT: t("pipeline.candidate.hud.nextActions.needStageT"),
      needStageS: t("pipeline.candidate.hud.nextActions.needStageS"),
      needStageB: t("pipeline.candidate.hud.nextActions.needStageB"),
      needStageC: t("pipeline.candidate.hud.nextActions.needStageC"),
      needStageK: t("pipeline.candidate.hud.nextActions.needStageK"),
      needStageR: t("pipeline.candidate.hud.nextActions.needStageR"),
      ready: t("pipeline.candidate.hud.nextActions.ready"),
    },
    gates: {
      eligibilityBlocked: t("pipeline.candidates.gates.eligibilityBlocked"),
      eligibilityReview: t("pipeline.candidates.gates.eligibilityReview"),
      complianceBlocked: t("pipeline.candidates.gates.complianceBlocked"),
    },
    filters: {
      label: t("pipeline.candidates.filters.label"),
      needsDecision: t("pipeline.candidates.filters.needsDecision"),
      blockedEligibility: t("pipeline.candidates.filters.blockedEligibility"),
      missingMarket: t("pipeline.candidates.filters.missingMarket"),
      profitableCashHeavy: t("pipeline.candidates.filters.profitableCashHeavy"),
      highRisk: t("pipeline.candidates.filters.highRisk"),
      lowConfidence: t("pipeline.candidates.filters.lowConfidence"),
      clear: t("pipeline.candidates.filters.clear"),
    },
    stageLabels: {
      P: t("pipeline.home.stageRail.stage.preSelection"),
      M: t("pipeline.candidate.section.stageM.label"),
      A: t("pipeline.candidate.section.stageA.label"),
      T: t("pipeline.candidate.section.stageT.label"),
      S: t("pipeline.candidate.section.stageS.label"),
      N: t("pipeline.candidate.section.stageN.label"),
      D: t("pipeline.candidate.section.stageD.label"),
      B: t("pipeline.candidate.section.stageB.label"),
      C: t("pipeline.candidate.section.stageC.label"),
      K: t("pipeline.candidate.section.stageK.label"),
      R: t("pipeline.candidate.section.stageR.label"),
      L: t("pipeline.nav.launches.label"),
    },
    bulk: {
      running: t("pipeline.candidates.bulk.running"),
      progress: t("pipeline.candidates.bulk.progress"),
      complete: t("pipeline.candidates.bulk.complete"),
      error: t("pipeline.candidates.bulk.error"),
      noneSelected: t("pipeline.candidates.bulk.noneSelected"),
    },
    bulkFullEval: {
      running: t("pipeline.candidates.bulkFullEval.running"),
      progress: t("pipeline.candidates.bulkFullEval.progress"),
      complete: t("pipeline.candidates.bulkFullEval.complete"),
      error: t("pipeline.candidates.bulkFullEval.error"),
      noneSelected: t("pipeline.candidates.bulkFullEval.noneSelected"),
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
