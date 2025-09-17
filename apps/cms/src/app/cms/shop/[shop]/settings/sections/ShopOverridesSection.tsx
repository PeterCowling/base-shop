"use client";

import {
  Accordion,
  Button,
  Card,
  CardContent,
  Input,
} from "@/components/atoms/shadcn";
import { FormField } from "@/components/molecules/FormField";
import type { MappingRow } from "@/hooks/useMappingRows";

export type ShopOverridesErrors = Partial<
  Record<"filterMappings" | "priceOverrides", string[]>
>;

export interface ShopOverridesSectionProps {
  filterMappings: MappingRow[];
  priceOverrides: MappingRow[];
  errors?: ShopOverridesErrors | Record<string, string[]>;
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

function joinErrors(
  errors: ShopOverridesSectionProps["errors"],
  key: "filterMappings" | "priceOverrides",
) {
  if (!errors) return undefined;
  const messages = errors[key];
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

export default function ShopOverridesSection({
  filterMappings,
  priceOverrides,
  errors,
  onAddFilterMapping,
  onUpdateFilterMapping,
  onRemoveFilterMapping,
  onAddPriceOverride,
  onUpdatePriceOverride,
  onRemovePriceOverride,
}: ShopOverridesSectionProps) {
  const filterError = joinErrors(errors, "filterMappings");
  const priceError = joinErrors(errors, "priceOverrides");

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
        {filterError ? (
          <p className="text-sm text-destructive">
            <span role="alert">{filterError}</span>
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
        {priceError ? (
          <p className="text-sm text-destructive">
            <span role="alert">{priceError}</span>
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
