"use client";

import { Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";

export type ShopSeoSectionErrors = Partial<Record<"catalogFilters", string[]>>;

export interface ShopSeoSectionProps {
  readonly catalogFilters: readonly string[];
  readonly errors?: ShopSeoSectionErrors;
  readonly onCatalogFiltersChange: (filters: string[]) => void;
}

function formatError(messages?: string[]) {
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

function joinFilters(filters: readonly string[]) {
  return filters.join(",");
}

function splitFilters(value: string) {
  return value.split(/,\s*/);
}

export default function ShopSeoSection({
  catalogFilters,
  errors,
  onCatalogFiltersChange,
}: ShopSeoSectionProps) {
  const errorMessage = formatError(errors?.catalogFilters);
  const errorId = errorMessage ? "catalog-filters-error" : undefined;

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">SEO</h3>
          <p className="text-sm text-muted-foreground">
            Provide a comma-separated list of catalog filters to embed within
            storefront metadata.
          </p>
        </div>

        <FormField
          label="Catalog filters"
          htmlFor="catalog-filters"
          error={
            errorMessage ? (
              <span id={errorId} role="alert">
                {errorMessage}
              </span>
            ) : undefined
          }
        >
          <Input
            id="catalog-filters"
            name="catalogFilters"
            value={joinFilters(catalogFilters)}
            onChange={(event) =>
              onCatalogFiltersChange(splitFilters(event.target.value))
            }
            placeholder="color,size,style"
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorId}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
