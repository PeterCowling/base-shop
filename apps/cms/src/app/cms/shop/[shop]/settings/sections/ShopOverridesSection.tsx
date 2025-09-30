"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  CardContent,
} from "@ui/components/atoms";
import type { MappingRowsController } from "../useShopEditorSubmit";

import MappingListField, {
  type MappingListFieldErrors,
} from "../components/MappingListField";
import { useTranslations } from "@acme/i18n";

export type ShopOverridesSectionErrors = Partial<
  Record<"filterMappings" | "priceOverrides", MappingListFieldErrors>
>;

export interface ShopOverridesSectionProps {
  readonly filterMappings: MappingRowsController;
  readonly priceOverrides: MappingRowsController;
  readonly errors?: ShopOverridesSectionErrors;
}

export default function ShopOverridesSection({
  filterMappings,
  priceOverrides,
  errors,
}: ShopOverridesSectionProps) {
  const t = useTranslations();
  const FILTER_MAPPING_ID_PREFIX = "filter-mapping"; // i18n-exempt -- CMS-TECH-001 dom id prefix [ttl=2026-01-01]
  const FILTER_ROW_CLASS = "sm:grid-cols-[2fr,2fr,auto]"; // i18n-exempt -- CMS-TECH-001 CSS utility classes [ttl=2026-01-01]
  const PRICE_OVERRIDE_ID_PREFIX = "price-override"; // i18n-exempt -- CMS-TECH-001 dom id prefix [ttl=2026-01-01]
  const PRICE_ROW_CLASS = "sm:grid-cols-[2fr,1fr,auto]"; // i18n-exempt -- CMS-TECH-001 CSS utility classes [ttl=2026-01-01]
  const ACCORDION_KEYS = ["filter-mappings", "price-overrides"] as const; // i18n-exempt -- CMS-TECH-001 internal accordion keys [ttl=2026-01-01]
  const filterContent = (
    <MappingListField
      controller={filterMappings}
      idPrefix={FILTER_MAPPING_ID_PREFIX}
      keyField={{
        field: "key",
        label: String(t("cms.shopOverrides.filterKey")),
        name: "filterMappingsKey",
        placeholder: String(t("cms.shopOverrides.filterKey.placeholder")),
      }}
      valueField={{
        field: "value",
        label: String(t("cms.shopOverrides.catalogAttribute")),
        name: "filterMappingsValue",
        placeholder: String(t("cms.shopOverrides.catalogAttribute.placeholder")),
      }}
      emptyMessage={t("cms.shopOverrides.emptyFilters")}
      addButtonLabel={String(t("cms.shopOverrides.addFilterMapping"))}
      removeButtonLabel={String(t("actions.remove"))}
      errors={errors?.filterMappings}
      rowClassName={FILTER_ROW_CLASS}
    />
  );

  const priceContent = (
    <MappingListField
      controller={priceOverrides}
      idPrefix={PRICE_OVERRIDE_ID_PREFIX}
      keyField={{
        field: "key",
        label: String(t("cms.shopOverrides.locale")),
        name: "priceOverridesKey",
        placeholder: String(t("cms.shopOverrides.locale.placeholder")),
      }}
      valueField={{
        field: "value",
        label: String(t("cms.shopOverrides.overrideMinorUnits")),
        name: "priceOverridesValue",
        placeholder: String(t("cms.shopOverrides.overrideMinorUnits.placeholder")),
        type: "number",
        inputMode: "numeric",
      }}
      emptyMessage={t("cms.shopOverrides.emptyPriceOverrides")}
      addButtonLabel={String(t("cms.shopOverrides.addPriceOverride"))}
      removeButtonLabel={String(t("actions.remove"))}
      errors={errors?.priceOverrides}
      rowClassName={PRICE_ROW_CLASS}
    />
  );

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t("cms.shopOverrides.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("cms.shopOverrides.subtitle")}
          </p>
        </div>

        <Accordion
          type="multiple"
          defaultValue={[...ACCORDION_KEYS]}
          className="space-y-3"
        >
          <AccordionItem
            value={ACCORDION_KEYS[0]}
            className="border-none"
          >
            <AccordionTrigger className="rounded-md border border-border/60 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
              {t("cms.shopOverrides.filterMappings")}
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              {filterContent}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value={ACCORDION_KEYS[1]}
            className="border-none"
          >
            <AccordionTrigger className="rounded-md border border-border/60 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
              {t("cms.shopOverrides.priceOverrides")}
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              {priceContent}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
