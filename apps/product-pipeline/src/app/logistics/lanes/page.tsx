import { Stack } from "@acme/design-system/primitives";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

import PageHeader from "@/components/PageHeader";

import LogisticsLanesClient from "./LogisticsLanesClient";
import type { LogisticsStrings } from "./types";

export default async function LogisticsLanesPage() {
  const t = await getTranslations("en");
  const strings: LogisticsStrings = {
    list: {
      label: t("pipeline.logistics.section.lanes.label"),
      title: t("pipeline.logistics.section.lanes.title"),
      empty: t("pipeline.logistics.labels.noLanes"),
    },
    create: {
      label: t("pipeline.logistics.section.create.label"),
      title: t("pipeline.logistics.section.create.title"),
      action: t("pipeline.logistics.section.create.action"),
    },
    help: {
      label: t("pipeline.logistics.section.help.label"),
      title: t("pipeline.logistics.section.help.title"),
      body: t("pipeline.logistics.section.help.body"),
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
    },
    options: {
      modelA: t("pipeline.logistics.options.modelA"),
      modelB: t("pipeline.logistics.options.modelB"),
      modelC: t("pipeline.logistics.options.modelC"),
      modelD: t("pipeline.logistics.options.modelD"),
    },
    labels: {
      latestVersion: t("pipeline.logistics.labels.latestVersion"),
      noVersions: t("pipeline.logistics.labels.noVersions"),
      viewLane: t("pipeline.logistics.labels.viewLane"),
      versionCount: t("pipeline.logistics.labels.versionCount"),
    },
    badges: {
      active: t("pipeline.logistics.badges.active"),
      inactive: t("pipeline.logistics.badges.inactive"),
      expired: t("pipeline.logistics.badges.expired"),
      expiring: t("pipeline.logistics.badges.expiring"),
      valid: t("pipeline.logistics.badges.valid"),
      noExpiry: t("pipeline.logistics.badges.noExpiry"),
    },
    messages: {
      createLaneSuccess: t("pipeline.logistics.messages.createLaneSuccess"),
      createLaneError: t("pipeline.logistics.messages.createLaneError"),
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
      <LogisticsLanesClient strings={strings} />
    </Stack>
  );
}
