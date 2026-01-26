import { Stack } from "@acme/design-system/primitives";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

import PageHeader from "@/components/PageHeader";

import LaneDetailClient from "./LaneDetailClient";
import type { LaneDetailStrings } from "./types";

export const runtime = "edge";

export default async function LaneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("en");

  const strings: LaneDetailStrings = {
    detail: {
      label: t("pipeline.logistics.section.detail.label"),
      title: t("pipeline.logistics.section.detail.title"),
    },
    version: {
      label: t("pipeline.logistics.section.version.label"),
      title: t("pipeline.logistics.section.version.title"),
      action: t("pipeline.logistics.section.version.action"),
    },
    evidence: {
      label: t("pipeline.logistics.section.evidence.label"),
      title: t("pipeline.logistics.section.evidence.title"),
      action: t("pipeline.logistics.section.evidence.action"),
    },
    actuals: {
      label: t("pipeline.logistics.section.actuals.label"),
      title: t("pipeline.logistics.section.actuals.title"),
      action: t("pipeline.logistics.section.actuals.action"),
      promoteLabel: t("pipeline.logistics.section.actuals.promoteLabel"),
      promoteHelp: t("pipeline.logistics.section.actuals.promoteHelp"),
    },
    fields: {
      name: t("pipeline.logistics.fields.name"),
      model: t("pipeline.logistics.fields.model"),
      origin: t("pipeline.logistics.fields.origin"),
      destination: t("pipeline.logistics.fields.destination"),
      destinationType: t("pipeline.logistics.fields.destinationType"),
      incoterm: t("pipeline.logistics.fields.incoterm"),
      description: t("pipeline.logistics.fields.description"),
      active: t("pipeline.logistics.fields.active"),
      versionLabel: t("pipeline.logistics.fields.versionLabel"),
      status: t("pipeline.logistics.fields.status"),
      confidence: t("pipeline.logistics.fields.confidence"),
      expiresAt: t("pipeline.logistics.fields.expiresAt"),
      currency: t("pipeline.logistics.fields.currency"),
      sourceCurrency: t("pipeline.logistics.fields.sourceCurrency"),
      fxRate: t("pipeline.logistics.fields.fxRate"),
      fxDate: t("pipeline.logistics.fields.fxDate"),
      fxSource: t("pipeline.logistics.fields.fxSource"),
      leadTimeLow: t("pipeline.logistics.fields.leadTimeLow"),
      leadTimeBase: t("pipeline.logistics.fields.leadTimeBase"),
      leadTimeHigh: t("pipeline.logistics.fields.leadTimeHigh"),
      costBasis: t("pipeline.logistics.fields.costBasis"),
      costAmount: t("pipeline.logistics.fields.costAmount"),
      costMinimum: t("pipeline.logistics.fields.costMinimum"),
      includedNotes: t("pipeline.logistics.fields.includedNotes"),
      excludedNotes: t("pipeline.logistics.fields.excludedNotes"),
      notes: t("pipeline.logistics.fields.notes"),
      evidenceKind: t("pipeline.logistics.fields.evidenceKind"),
      evidenceFile: t("pipeline.logistics.fields.evidenceFile"),
      evidenceLink: t("pipeline.logistics.fields.evidenceLink"),
      actualCostAmount: t("pipeline.logistics.fields.actualCostAmount"),
      actualLeadTimeDays: t("pipeline.logistics.fields.actualLeadTimeDays"),
      actualsSource: t("pipeline.logistics.fields.actualsSource"),
      actualsNotes: t("pipeline.logistics.fields.actualsNotes"),
    },
    badges: {
      active: t("pipeline.logistics.badges.active"),
      inactive: t("pipeline.logistics.badges.inactive"),
      expired: t("pipeline.logistics.badges.expired"),
      expiring: t("pipeline.logistics.badges.expiring"),
      valid: t("pipeline.logistics.badges.valid"),
      noExpiry: t("pipeline.logistics.badges.noExpiry"),
    },
    labels: {
      versionDiff: t("pipeline.logistics.labels.versionDiff"),
      evidenceCount: t("pipeline.logistics.labels.evidenceCount"),
      viewEvidence: t("pipeline.logistics.labels.viewEvidence"),
      hideEvidence: t("pipeline.logistics.labels.hideEvidence"),
      openDocument: t("pipeline.logistics.labels.openDocument"),
      noVersions: t("pipeline.logistics.labels.noVersions"),
      actualsCount: t("pipeline.logistics.labels.actualsCount"),
      actualsAvgCost: t("pipeline.logistics.labels.actualsAvgCost"),
      actualsAvgLeadTime: t("pipeline.logistics.labels.actualsAvgLeadTime"),
      actualsVarianceCost: t("pipeline.logistics.labels.actualsVarianceCost"),
      actualsVarianceLeadTime: t(
        "pipeline.logistics.labels.actualsVarianceLeadTime",
      ),
      actualsLatest: t("pipeline.logistics.labels.actualsLatest"),
      noActuals: t("pipeline.logistics.labels.noActuals"),
      eligibleForC3: t("pipeline.logistics.labels.eligibleForC3"),
    },
    placeholders: {
      selectVersion: t("pipeline.logistics.placeholders.selectVersion"),
      optional: t("pipeline.logistics.placeholders.optional"),
    },
    messages: {
      createVersionSuccess: t("pipeline.logistics.messages.createVersionSuccess"),
      createVersionError: t("pipeline.logistics.messages.createVersionError"),
      uploadEvidenceSuccess: t("pipeline.logistics.messages.uploadEvidenceSuccess"),
      uploadEvidenceError: t("pipeline.logistics.messages.uploadEvidenceError"),
      createActualsSuccess: t("pipeline.logistics.messages.createActualsSuccess"),
      createActualsError: t("pipeline.logistics.messages.createActualsError"),
    },
    notAvailable: t("pipeline.common.notAvailable"),
  };

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.logistics.badge")}
        title={t("pipeline.logistics.title")}
        subtitle={t("pipeline.logistics.subtitle")}
      />
      <LaneDetailClient laneId={id} strings={strings} />
    </Stack>
  );
}
