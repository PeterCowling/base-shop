import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { Stack } from "@acme/design-system/primitives";

import PageHeader from "@/components/PageHeader";

import LaunchesClient from "./LaunchesClient";
import type { LaunchesStrings } from "./types";

export default async function LaunchesPage() {
  const t = await getTranslations("en");
  const strings: LaunchesStrings = {
    plansLabel: t("pipeline.launches.plans.label"),
    plansTitle: t("pipeline.launches.plans.title"),
    createLabel: t("pipeline.launches.create.label"),
    createTitle: t("pipeline.launches.create.title"),
    ingestLabel: t("pipeline.launches.ingest.label"),
    ingestTitle: t("pipeline.launches.ingest.title"),
    fields: {
      candidate: t("pipeline.launches.fields.candidate"),
      plannedUnits: t("pipeline.launches.fields.plannedUnits"),
      plannedUnitsPerDay: t("pipeline.launches.fields.plannedUnitsPerDay"),
      status: t("pipeline.launches.fields.status"),
      notes: t("pipeline.launches.fields.notes"),
      actualVelocity: t("pipeline.launches.fields.actualVelocity"),
      velocityPrior: t("pipeline.launches.fields.velocityPrior"),
      velocityPriorSource: t("pipeline.launches.fields.velocityPriorSource"),
      variance: t("pipeline.launches.fields.variance"),
      decision: t("pipeline.launches.fields.decision"),
      decisionNotes: t("pipeline.launches.fields.decisionNotes"),
      decisionAt: t("pipeline.launches.fields.decisionAt"),
      decisionBy: t("pipeline.launches.fields.decisionBy"),
      actualsCsv: t("pipeline.launches.fields.actualsCsv"),
      actualsHelper: t("pipeline.launches.fields.actualsHelper"),
      actualCostAmount: t("pipeline.launches.fields.actualCostAmount"),
      actualLeadTimeDays: t("pipeline.launches.fields.actualLeadTimeDays"),
      laneActualsLabel: t("pipeline.launches.fields.laneActualsLabel"),
      laneActualsHelp: t("pipeline.launches.fields.laneActualsHelp"),
      launchPlan: t("pipeline.launches.fields.launchPlan"),
    },
    actions: {
      create: t("pipeline.launches.actions.create"),
      ingest: t("pipeline.launches.actions.ingest"),
      decide: t("pipeline.launches.actions.decide"),
    },
    messages: {
      createSuccess: t("pipeline.launches.messages.createSuccess"),
      createError: t("pipeline.launches.messages.createError"),
      ingestSuccess: t("pipeline.launches.messages.ingestSuccess"),
      ingestError: t("pipeline.launches.messages.ingestError"),
      decisionSuccess: t("pipeline.launches.messages.decisionSuccess"),
      decisionError: t("pipeline.launches.messages.decisionError"),
    },
    statusLabels: {
      planned: t("pipeline.launches.status.planned"),
      pilot: t("pipeline.launches.status.pilot"),
      ingested: t("pipeline.launches.status.ingested"),
    },
    decisionLabels: {
      scale: t("pipeline.launches.decision.scale"),
      kill: t("pipeline.launches.decision.kill"),
    },
    decisionLabel: t("pipeline.launches.decision.label"),
    decisionTitle: t("pipeline.launches.decision.title"),
    placeholders: {
      selectCandidate: t("pipeline.launches.placeholders.selectCandidate"),
      selectLaunch: t("pipeline.launches.placeholders.selectLaunch"),
    },
    emptyLabel: t("pipeline.launches.empty"),
    notAvailable: t("pipeline.common.notAvailable"),
  };

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.launches.badge")}
        title={t("pipeline.launches.title")}
        subtitle={t("pipeline.launches.subtitle")}
      />
      <LaunchesClient strings={strings} />
    </Stack>
  );
}
