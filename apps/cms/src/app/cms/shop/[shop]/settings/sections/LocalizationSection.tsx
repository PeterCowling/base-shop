"use client";

import {
  Button,
  Card,
  CardContent,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui";
import { renderError, type MappingListProps } from "./shared";

export interface CatalogFiltersFieldProps {
  value: string;
  error?: string[];
  onChange: (value: string) => void;
}

export interface LocaleOverridesProps extends MappingListProps {
  availableLocales: string[];
}

export interface LocalizationSectionProps {
  catalogFilters: CatalogFiltersFieldProps;
  filterMappings: MappingListProps;
  localeOverrides: LocaleOverridesProps;
}

export function LocalizationSection({
  catalogFilters,
  filterMappings,
  localeOverrides,
}: LocalizationSectionProps) {
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="space-y-6">
        <FormField
          label="Catalog filters"
          htmlFor="catalog-filters"
          error={renderError(catalogFilters.error)}
        >
          <Input
            id="catalog-filters"
            name="catalogFilters"
            value={catalogFilters.value}
            placeholder="color, size, style"
            onChange={(event) => catalogFilters.onChange(event.target.value)}
            aria-invalid={catalogFilters.error ? true : undefined}
          />
        </FormField>

        <FormField
          label="Filter mappings"
          error={renderError(filterMappings.error)}
        >
          <div className="space-y-3">
            {filterMappings.rows.map((row, index) => {
              const keyId = `filter-mapping-${index}-key`;
              const valueId = `filter-mapping-${index}-value`;
              return (
                <div
                  key={`${keyId}-${valueId}`}
                  className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center"
                >
                  <Input
                    id={keyId}
                    name="filterMappingsKey"
                    value={row.key}
                    placeholder="Filter"
                    onChange={(event) =>
                      filterMappings.onUpdate(index, "key", event.target.value)
                    }
                    aria-invalid={filterMappings.error ? true : undefined}
                    className="md:flex-1"
                  />
                  <Input
                    id={valueId}
                    name="filterMappingsValue"
                    value={row.value}
                    placeholder="Mapping"
                    onChange={(event) =>
                      filterMappings.onUpdate(index, "value", event.target.value)
                    }
                    aria-invalid={filterMappings.error ? true : undefined}
                    className="md:flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => filterMappings.onRemove(index)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
            <Button type="button" variant="outline" onClick={filterMappings.onAdd}>
              Add mapping
            </Button>
          </div>
        </FormField>

        <FormField
          label="Locale overrides"
          error={renderError(localeOverrides.error)}
        >
          <div className="space-y-3">
            {localeOverrides.rows.map((row, index) => {
              const keyId = `locale-override-${index}-key`;
              const selectId = `locale-override-${index}-value`;
              return (
                <div
                  key={`${keyId}-${selectId}`}
                  className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center"
                >
                  <Input
                    id={keyId}
                    name="localeOverridesKey"
                    value={row.key}
                    placeholder="Field"
                    onChange={(event) =>
                      localeOverrides.onUpdate(index, "key", event.target.value)
                    }
                    aria-invalid={localeOverrides.error ? true : undefined}
                    className="md:flex-1"
                  />
                  <div className="md:flex-1">
                    <Select
                      value={row.value}
                      onValueChange={(value) =>
                        localeOverrides.onUpdate(index, "value", value)
                      }
                    >
                      <SelectTrigger
                        id={selectId}
                        aria-invalid={localeOverrides.error ? true : undefined}
                      >
                        <SelectValue placeholder="Select locale" />
                      </SelectTrigger>
                      <SelectContent>
                        {localeOverrides.availableLocales.map((locale) => (
                          <SelectItem key={locale} value={locale}>
                            {locale}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="hidden"
                      name="localeOverridesValue"
                      value={row.value}
                      aria-hidden
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => localeOverrides.onRemove(index)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              onClick={localeOverrides.onAdd}
            >
              Add override
            </Button>
          </div>
        </FormField>
      </CardContent>
    </Card>
  );
}

export default LocalizationSection;
