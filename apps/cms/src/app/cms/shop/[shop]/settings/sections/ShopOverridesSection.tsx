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
  const filterContent = (
    <MappingListField
      controller={filterMappings}
      idPrefix="filter-mapping" // i18n-exempt: DOM id prefix, not user-visible copy
      keyField={{
        field: "key",
        label: t("Filter key"),
        name: "filterMappingsKey",
        placeholder: t("color"),
      }}
      valueField={{
        field: "value",
        label: t("Catalog attribute"),
        name: "filterMappingsValue",
        placeholder: t("attributes.color"),
      }}
      emptyMessage={t(
        "No filter mappings configured. Add mappings to translate storefront facets into catalog attributes."
      )}
      addButtonLabel={t("Add filter mapping")}
      removeButtonLabel={t("Remove")}
      errors={errors?.filterMappings}
      rowClassName="sm:grid-cols-[2fr,2fr,auto]" // i18n-exempt: CSS utility classes, not user copy
    />
  );

  const priceContent = (
    <MappingListField
      controller={priceOverrides}
      idPrefix="price-override" // i18n-exempt: DOM id prefix, not user-visible copy
      keyField={{
        field: "key",
        label: t("Locale"),
        name: "priceOverridesKey",
        placeholder: t("en-GB"),
      }}
      valueField={{
        field: "value",
        label: t("Override (minor units)"),
        name: "priceOverridesValue",
        placeholder: t("12000"),
        type: "number",
        inputMode: "numeric",
      }}
      emptyMessage={t(
        "No price overrides defined. Configure overrides to adjust pricing for specific locales."
      )}
      addButtonLabel={t("Add price override")}
      removeButtonLabel={t("Remove")}
      errors={errors?.priceOverrides}
      rowClassName="sm:grid-cols-[2fr,1fr,auto]" // i18n-exempt: CSS utility classes, not user copy
    />
  );

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t("Overrides")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "Fine-tune how storefront filters and pricing map to catalog data."
            )}
          </p>
        </div>

        <Accordion
          type="multiple"
          defaultValue={["filter-mappings", "price-overrides"]}
          className="space-y-3"
        >
          <AccordionItem
            value="filter-mappings" // i18n-exempt: internal accordion value key
            className="border-none"
          >
            <AccordionTrigger className="rounded-md border border-border/60 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
              {t("Filter mappings")}
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              {filterContent}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="price-overrides" // i18n-exempt: internal accordion value key
            className="border-none"
          >
            <AccordionTrigger className="rounded-md border border-border/60 bg-muted/30 px-4 py-2 text-start text-sm font-semibold">
              {t("Price overrides")}
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
