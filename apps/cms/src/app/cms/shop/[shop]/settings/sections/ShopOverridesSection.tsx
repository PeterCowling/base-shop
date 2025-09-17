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
import { MappingListField } from "../components/MappingListField";

export type ShopOverridesSectionErrors = Partial<
  Record<"filterMappings" | "priceOverrides", string[]>
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
              <MappingListField
                controller={filterMappings}
                keyField={{
                  label: "Filter key",
                  name: "filterMappingsKey",
                  placeholder: "color",
                }}
                valueField={{
                  label: "Catalog attribute",
                  name: "filterMappingsValue",
                  placeholder: "attributes.color",
                }}
                addLabel="Add filter mapping"
                emptyState="No filter mappings configured. Add mappings to translate storefront facets into catalog attributes."
                errors={errors?.filterMappings}
                errorId={
                  errors?.filterMappings && errors.filterMappings.length > 0
                    ? "filter-mappings-error"
                    : undefined
                }
                rowLayout="sm:grid-cols-[2fr,2fr,auto]"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="price-overrides" className="border-none">
            <AccordionTrigger className="rounded-md border border-border/60 bg-muted/30 px-4 py-2 text-left text-sm font-semibold">
              Price overrides
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              <MappingListField
                controller={priceOverrides}
                keyField={{
                  label: "Locale",
                  name: "priceOverridesKey",
                  placeholder: "en-GB",
                }}
                valueField={{
                  label: "Override (minor units)",
                  name: "priceOverridesValue",
                  placeholder: "12000",
                  type: "number",
                  inputMode: "numeric",
                }}
                addLabel="Add price override"
                emptyState="No price overrides defined. Configure overrides to adjust pricing for specific locales."
                errors={errors?.priceOverrides}
                errorId={
                  errors?.priceOverrides && errors.priceOverrides.length > 0
                    ? "price-overrides-error"
                    : undefined
                }
                rowLayout="sm:grid-cols-[2fr,1fr,auto]"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
