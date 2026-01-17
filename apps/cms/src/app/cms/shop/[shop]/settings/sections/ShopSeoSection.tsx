"use client";

import { Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@acme/ui/components/molecules";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  const errorMessage = formatError(errors?.catalogFilters);
  const errorId = errorMessage ? "catalog-filters-error" : undefined;

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t("SEO")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "Provide a comma-separated list of catalog filters to embed within storefront metadata."
            )}
          </p>
        </div>

        <FormField
          label={t("Catalog filters")}
          htmlFor={"catalog-filters" /* i18n-exempt: technical control id */}
          error={
            errorMessage ? (
              <span id={errorId} role="alert">
                {errorMessage}
              </span>
            ) : undefined
          }
        >
          <Input
            id={"catalog-filters" /* i18n-exempt: technical control id */}
            name={"catalogFilters" /* i18n-exempt: technical form field name */}
            value={joinFilters(catalogFilters)}
            onChange={(event) =>
              onCatalogFiltersChange(splitFilters(event.target.value))
            }
            placeholder={String(t("color,size,style"))}
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorId}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
