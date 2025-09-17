"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  Input,
} from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import type { MappingRowsController } from "../useShopEditorSubmit";

export type ShopOverridesSectionErrors = Partial<
  Record<"filterMappings" | "priceOverrides", string[]>
>;

export interface ShopOverridesSectionProps {
  readonly filterMappings: MappingRowsController;
  readonly priceOverrides: MappingRowsController;
  readonly errors?: ShopOverridesSectionErrors;
}

function formatError(messages?: string[]) {
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

export default function ShopOverridesSection({
  filterMappings,
  priceOverrides,
  errors,
}: ShopOverridesSectionProps) {
  const filterError = formatError(errors?.filterMappings);
  const priceError = formatError(errors?.priceOverrides);
  const filterErrorId = filterError ? "filter-mappings-error" : undefined;
  const priceErrorId = priceError ? "price-overrides-error" : undefined;

  const filterContent = (
    <div className="space-y-4">
      {filterMappings.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No filter mappings configured. Add mappings to translate storefront
          facets into catalog attributes.
        </p>
      ) : (
        filterMappings.rows.map((row, index) => {
          const keyId = `filter-mapping-key-${index}`;
          const valueId = `filter-mapping-value-${index}`;
          return (
            <div
              key={keyId}
              className="grid gap-4 sm:grid-cols-[2fr,2fr,auto] sm:items-end"
            >
              <FormField label="Filter key" htmlFor={keyId}>
                <Input
                  id={keyId}
                  name="filterMappingsKey"
                  value={row.key}
                  onChange={(event) =>
                    filterMappings.update(index, "key", event.target.value)
                  }
                  placeholder="color"
                  aria-describedby={filterErrorId}
                />
              </FormField>
              <FormField label="Catalog attribute" htmlFor={valueId}>
                <Input
                  id={valueId}
                  name="filterMappingsValue"
                  value={row.value}
                  onChange={(event) =>
                    filterMappings.update(index, "value", event.target.value)
                  }
                  placeholder="attributes.color"
                  aria-describedby={filterErrorId}
                />
              </FormField>
              <Button
                type="button"
                variant="ghost"
                onClick={() => filterMappings.remove(index)}
              >
                Remove
              </Button>
            </div>
          );
        })
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          onClick={filterMappings.add}
          className="w-full sm:w-auto"
        >
          Add filter mapping
        </Button>
        {filterError ? (
          <p id={filterErrorId} className="text-sm text-destructive" role="alert">
            {filterError}
          </p>
        ) : null}
      </div>
    </div>
  );

  const priceContent = (
    <div className="space-y-4">
      {priceOverrides.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No price overrides defined. Configure overrides to adjust pricing for
          specific locales.
        </p>
      ) : (
        priceOverrides.rows.map((row, index) => {
          const keyId = `price-override-key-${index}`;
          const valueId = `price-override-value-${index}`;
          return (
            <div
              key={keyId}
              className="grid gap-4 sm:grid-cols-[2fr,1fr,auto] sm:items-end"
            >
              <FormField label="Locale" htmlFor={keyId}>
                <Input
                  id={keyId}
                  name="priceOverridesKey"
                  value={row.key}
                  onChange={(event) =>
                    priceOverrides.update(index, "key", event.target.value)
                  }
                  placeholder="en-GB"
                  aria-describedby={priceErrorId}
                />
              </FormField>
              <FormField label="Override (minor units)" htmlFor={valueId}>
                <Input
                  id={valueId}
                  type="number"
                  inputMode="numeric"
                  name="priceOverridesValue"
                  value={row.value}
                  onChange={(event) =>
                    priceOverrides.update(index, "value", event.target.value)
                  }
                  placeholder="12000"
                  aria-describedby={priceErrorId}
                />
              </FormField>
              <Button
                type="button"
                variant="ghost"
                onClick={() => priceOverrides.remove(index)}
              >
                Remove
              </Button>
            </div>
          );
        })
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          onClick={priceOverrides.add}
          className="w-full sm:w-auto"
        >
          Add price override
        </Button>
        {priceError ? (
          <p id={priceErrorId} className="text-sm text-destructive" role="alert">
            {priceError}
          </p>
        ) : null}
      </div>
    </div>
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
