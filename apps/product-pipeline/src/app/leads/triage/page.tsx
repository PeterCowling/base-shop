import PageHeader from "@/components/PageHeader";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { Stack } from "@ui/components/atoms/primitives";
import LeadTriageClient from "./LeadTriageClient";
import type { LeadTriageStrings } from "./types";

export default async function LeadsTriagePage() {
  const t = await getTranslations("en");
  const strings: LeadTriageStrings = {
    filters: {
      label: t("pipeline.leads.triage.filters.label"),
      title: t("pipeline.leads.triage.filters.title"),
      source: t("pipeline.leads.triage.filters.source"),
      sourceContext: t("pipeline.leads.triage.filters.sourceContext"),
      status: t("pipeline.leads.triage.filters.status"),
      triageBand: t("pipeline.leads.triage.filters.triageBand"),
      search: t("pipeline.leads.triage.filters.search"),
      apply: t("pipeline.leads.triage.filters.apply"),
      reset: t("pipeline.leads.triage.filters.reset"),
    },
    actions: {
      runStageP: t("pipeline.leads.triage.actions.runStageP"),
      promoteTop: t("pipeline.leads.triage.actions.promoteTop"),
      promoteCount: t("pipeline.leads.triage.actions.promoteCount"),
      rejectCooldown: t("pipeline.leads.triage.actions.rejectCooldown"),
    },
    results: {
      label: t("pipeline.leads.triage.results.label"),
      title: t("pipeline.leads.triage.results.title"),
    },
    table: {
      select: t("pipeline.leads.triage.table.select"),
      lead: t("pipeline.leads.triage.table.lead"),
      source: t("pipeline.leads.triage.table.source"),
      context: t("pipeline.leads.triage.table.context"),
      triage: t("pipeline.leads.triage.table.triage"),
      score: t("pipeline.leads.triage.table.score"),
      status: t("pipeline.leads.triage.table.status"),
      duplicate: t("pipeline.leads.triage.table.duplicate"),
      reasons: t("pipeline.leads.triage.table.reasons"),
    },
    duplicate: {
      label: t("pipeline.leads.triage.duplicate.label"),
      title: t("pipeline.leads.triage.duplicate.title"),
      empty: t("pipeline.leads.triage.duplicate.empty"),
      primary: t("pipeline.leads.triage.duplicate.primary"),
      duplicateOf: t("pipeline.leads.triage.duplicate.duplicateOf"),
      holdDuplicates: t("pipeline.leads.triage.duplicate.hold"),
    },
    override: {
      label: t("pipeline.leads.triage.override.label"),
      title: t("pipeline.leads.triage.override.title"),
      reasonLabel: t("pipeline.leads.triage.override.reason"),
      requestedByLabel: t("pipeline.leads.triage.override.requestedBy"),
      apply: t("pipeline.leads.triage.override.apply"),
      noSelection: t("pipeline.leads.triage.override.noSelection"),
    },
    fingerprintOverride: {
      label: t("pipeline.leads.triage.fingerprintOverride.label"),
      title: t("pipeline.leads.triage.fingerprintOverride.title"),
      fingerprintLabel: t("pipeline.leads.triage.fingerprintOverride.fingerprint"),
      reasonLabel: t("pipeline.leads.triage.fingerprintOverride.reason"),
      requestedByLabel: t("pipeline.leads.triage.fingerprintOverride.requestedBy"),
      apply: t("pipeline.leads.triage.fingerprintOverride.apply"),
      clear: t("pipeline.leads.triage.fingerprintOverride.clear"),
      noSelection: t("pipeline.leads.triage.fingerprintOverride.noSelection"),
    },
    cooldown: {
      label: t("pipeline.leads.triage.cooldown.label"),
      title: t("pipeline.leads.triage.cooldown.title"),
      reason: t("pipeline.leads.triage.cooldown.reason"),
      severity: t("pipeline.leads.triage.cooldown.severity"),
      whatWouldChange: t("pipeline.leads.triage.cooldown.whatWouldChange"),
      recheckDays: t("pipeline.leads.triage.cooldown.recheckDays"),
      apply: t("pipeline.leads.triage.cooldown.apply"),
      success: t("pipeline.leads.triage.cooldown.success"),
      error: t("pipeline.leads.triage.cooldown.error"),
      noSelection: t("pipeline.leads.triage.cooldown.noSelection"),
      defaultWhatWouldChange: t("pipeline.leads.triage.cooldown.defaultWhatWouldChange"),
    },
    options: {
      all: t("pipeline.leads.triage.options.all"),
      statusNew: t("pipeline.leads.triage.options.statusNew"),
      statusHold: t("pipeline.leads.triage.options.statusHold"),
      statusPromoted: t("pipeline.leads.triage.options.statusPromoted"),
      statusRejected: t("pipeline.leads.triage.options.statusRejected"),
      triageHigh: t("pipeline.leads.triage.options.triageHigh"),
      triageMedium: t("pipeline.leads.triage.options.triageMedium"),
      triageLow: t("pipeline.leads.triage.options.triageLow"),
      severityShort: t("pipeline.leads.triage.options.severityShort"),
      severityLong: t("pipeline.leads.triage.options.severityLong"),
      severityPermanent: t("pipeline.leads.triage.options.severityPermanent"),
      reasonLowSignal: t("pipeline.leads.triage.options.reasonLowSignal"),
      reasonHazmatKeyword: t("pipeline.leads.triage.options.reasonHazmatKeyword"),
      reasonPriceTooLow: t("pipeline.leads.triage.options.reasonPriceTooLow"),
      reasonPriceTooHigh: t("pipeline.leads.triage.options.reasonPriceTooHigh"),
      reasonPriceHigh: t("pipeline.leads.triage.options.reasonPriceHigh"),
      reasonShortTitle: t("pipeline.leads.triage.options.reasonShortTitle"),
      reasonDuplicateExisting: t("pipeline.leads.triage.options.reasonDuplicateExisting"),
      reasonDuplicateBatch: t("pipeline.leads.triage.options.reasonDuplicateBatch"),
      reasonPolicyBlocked: t("pipeline.leads.triage.options.reasonPolicyBlocked"),
    },
    messages: {
      loading: t("pipeline.leads.triage.messages.loading"),
      empty: t("pipeline.leads.triage.messages.empty"),
      running: t("pipeline.leads.triage.messages.running"),
      runComplete: t("pipeline.leads.triage.messages.runComplete"),
      error: t("pipeline.leads.triage.messages.error"),
    },
    notAvailable: t("pipeline.common.notAvailable"),
  };

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.leads.triage.badge")}
        title={t("pipeline.leads.triage.title")}
        subtitle={t("pipeline.leads.triage.subtitle")}
      />
      <LeadTriageClient strings={strings} />
    </Stack>
  );
}
