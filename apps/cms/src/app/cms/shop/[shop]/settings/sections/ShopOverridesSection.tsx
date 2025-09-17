"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  CardContent,
} from "@ui/components";
import type { MappingRowsController } from "../useShopEditorSubmit";

import MappingListField, {
  type MappingListFieldErrors,
} from "../components/MappingListField";

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
  const filterContent = (
    <MappingListField
      controller={filterMappings}
      idPrefix="filter-mapping"
      keyField={{
        field: "key",
        label: "Filter key",
        name: "filterMappingsKey",
        placeholder: "color",
      }}
      valueField={{
        field: "value",
        label: "Catalog attribute",
        name: "filterMappingsValue",
        placeholder: "attributes.color",
      }}
      emptyMessage="No filter mappings configured. Add mappings to translate storefront facets into catalog attributes."
      addButtonLabel="Add filter mapping"
      removeButtonLabel="Remove"
      errors={errors?.filterMappings}
      rowClassName="sm:grid-cols-[2fr,2fr,auto]"
    />
  );

  const priceContent = (
    <MappingListField
      controller={priceOverrides}
      idPrefix="price-override"
      keyField={{
        field: "key",
        label: "Locale",
        name: "priceOverridesKey",
        placeholder: "en-GB",
      }}
      valueField={{
        field: "value",
        label: "Override (minor units)",
        name: "priceOverridesValue",
        placeholder: "12000",
        type: "number",
        inputMode: "numeric",
      }}
      emptyMessage="No price overrides defined. Configure overrides to adjust pricing for specific locales."
      addButtonLabel="Add price override"
      removeButtonLabel="Remove"
      errors={errors?.priceOverrides}
      rowClassName="sm:grid-cols-[2fr,1fr,auto]"
    />
  );

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Overrides</h3>
          <p className="text-sm text-muted-foreground">
            Fine-tune how storefront filters and pricing map to catalog data.
          </p>
        </div>

        <Accordion
          type="multiple"
          defaultValue={["filter-mappings", "price-overrides"]}
          className="space-y-3"
        >
          <AccordionItem value="filter-mappings" className="border-none">
            <AccordionTrigger className="rounded-md border border-border/60 bg-muted/30 px-4 py-2 text-left text-sm font-semibold">
              Filter mappings
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              {filterContent}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="price-overrides" className="border-none">
            <AccordionTrigger className="rounded-md border border-border/60 bg-muted/30 px-4 py-2 text-left text-sm font-semibold">
              Price overrides
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
