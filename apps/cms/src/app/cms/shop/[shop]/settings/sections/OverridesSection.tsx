"use client";

import {
  Accordion,
  Button,
  Card,
  CardContent,
  FormField,
  Input,
} from "@ui";
import type { MappingRow } from "@/hooks/useMappingRows";

export type OverridesSectionErrors = Partial<
  Record<"filterMappings" | "priceOverrides", string[]>
>;

export interface OverridesSectionProps {
  filterMappings: MappingRow[];
  priceOverrides: MappingRow[];
  errors?: OverridesSectionErrors;
  onAddFilterMapping: () => void;
  onUpdateFilterMapping: (
    index: number,
    field: "key" | "value",
    value: string,
  ) => void;
  onRemoveFilterMapping: (index: number) => void;
  onAddPriceOverride: () => void;
  onUpdatePriceOverride: (
    index: number,
    field: "key" | "value",
    value: string,
  ) => void;
  onRemovePriceOverride: (index: number) => void;
}

function formatError(messages?: string[]) {
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

export default function OverridesSection({
  filterMappings,
  priceOverrides,
  errors,
  onAddFilterMapping,
  onUpdateFilterMapping,
  onRemoveFilterMapping,
  onAddPriceOverride,
  onUpdatePriceOverride,
  onRemovePriceOverride,
}: OverridesSectionProps) {
  const filterContent = (
    <div className="space-y-4">
      {filterMappings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No filter mappings configured. Add mappings to translate storefront facets into catalog attributes.
        </p>
      ) : (
        filterMappings.map((row, index) => {
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
                    onUpdateFilterMapping(index, "key", event.target.value)
                  }
                  placeholder="color"
                />
              </FormField>
              <FormField label="Catalog attribute" htmlFor={valueId}>
                <Input
                  id={valueId}
                  name="filterMappingsValue"
                  value={row.value}
                  onChange={(event) =>
                    onUpdateFilterMapping(index, "value", event.target.value)
                  }
                  placeholder="attributes.color"
                />
              </FormField>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onRemoveFilterMapping(index)}
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
          onClick={onAddFilterMapping}
          className="w-full sm:w-auto"
        >
          Add filter mapping
        </Button>
        {errors?.filterMappings ? (
          <p className="text-sm text-destructive">
            {formatError(errors.filterMappings)}
          </p>
        ) : null}
      </div>
    </div>
  );

  const priceContent = (
    <div className="space-y-4">
      {priceOverrides.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No price overrides defined. Configure overrides to adjust pricing for specific locales.
        </p>
      ) : (
        priceOverrides.map((row, index) => {
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
                    onUpdatePriceOverride(index, "key", event.target.value)
                  }
                  placeholder="en-GB"
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
                    onUpdatePriceOverride(index, "value", event.target.value)
                  }
                  placeholder="12000"
                />
              </FormField>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onRemovePriceOverride(index)}
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
          onClick={onAddPriceOverride}
          className="w-full sm:w-auto"
        >
          Add price override
        </Button>
        {errors?.priceOverrides ? (
          <p className="text-sm text-destructive">
            {formatError(errors.priceOverrides)}
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
          items={[
            { title: "Filter mappings", content: filterContent },
            { title: "Price overrides", content: priceContent },
          ]}
        />
      </CardContent>
    </Card>
  );
}
