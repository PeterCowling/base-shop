import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { Stack } from "@acme/ui/components/atoms/primitives";

import PageHeader from "@/components/PageHeader";

import QuoteBasketProfilesClient from "./QuoteBasketProfilesClient";
import type { QuoteBasketStrings } from "./types";

export default async function QuoteBasketProfilesPage() {
  const t = await getTranslations("en");
  const strings: QuoteBasketStrings = {
    list: {
      label: t("pipeline.quoteBaskets.section.list.label"),
      title: t("pipeline.quoteBaskets.section.list.title"),
      empty: t("pipeline.quoteBaskets.section.list.empty"),
    },
    create: {
      label: t("pipeline.quoteBaskets.section.create.label"),
      title: t("pipeline.quoteBaskets.section.create.title"),
      action: t("pipeline.quoteBaskets.section.create.action"),
    },
    help: {
      label: t("pipeline.quoteBaskets.section.help.label"),
      title: t("pipeline.quoteBaskets.section.help.title"),
      body: t("pipeline.quoteBaskets.section.help.body"),
    },
    fields: {
      name: t("pipeline.quoteBaskets.fields.name"),
      profileType: t("pipeline.quoteBaskets.fields.profileType"),
      origin: t("pipeline.quoteBaskets.fields.origin"),
      destination: t("pipeline.quoteBaskets.fields.destination"),
      destinationType: t("pipeline.quoteBaskets.fields.destinationType"),
      incoterm: t("pipeline.quoteBaskets.fields.incoterm"),
      cartonCount: t("pipeline.quoteBaskets.fields.cartonCount"),
      unitsPerCarton: t("pipeline.quoteBaskets.fields.unitsPerCarton"),
      weightKg: t("pipeline.quoteBaskets.fields.weightKg"),
      cbm: t("pipeline.quoteBaskets.fields.cbm"),
      dimensionsCm: t("pipeline.quoteBaskets.fields.dimensionsCm"),
      hazmatFlag: t("pipeline.quoteBaskets.fields.hazmatFlag"),
      notes: t("pipeline.quoteBaskets.fields.notes"),
    },
    labels: {
      hazmat: t("pipeline.quoteBaskets.labels.hazmat"),
    },
    messages: {
      createSuccess: t("pipeline.quoteBaskets.messages.createSuccess"),
      createError: t("pipeline.quoteBaskets.messages.createError"),
    },
    notAvailable: t("pipeline.common.notAvailable"),
  };

  return (
    <Stack gap={6}>
      <PageHeader
        badge={t("pipeline.quoteBaskets.badge")}
        title={t("pipeline.quoteBaskets.title")}
        subtitle={t("pipeline.quoteBaskets.subtitle")}
      />
      <QuoteBasketProfilesClient strings={strings} />
    </Stack>
  );
}
