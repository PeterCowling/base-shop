"use client";

import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import type { MappingRow } from "@/hooks/useMappingRows";
import type { ChangeEvent } from "react";

interface ShopLocalizationSectionProps {
  mappings: MappingRow[];
  onAddMapping: () => void;
  onUpdateMapping: (index: number, field: "key" | "value", value: string) => void;
  onRemoveMapping: (index: number) => void;
  localeOverrides: MappingRow[];
  onAddLocaleOverride: () => void;
  onUpdateLocaleOverride: (index: number, field: "key" | "value", value: string) => void;
  onRemoveLocaleOverride: (index: number) => void;
  errors: Record<string, string[]>;
}

const supportedLocales = ["en", "de", "it"] as const;

export default function ShopLocalizationSection({
  mappings,
  onAddMapping,
  onUpdateMapping,
  onRemoveMapping,
  localeOverrides,
  onAddLocaleOverride,
  onUpdateLocaleOverride,
  onRemoveLocaleOverride,
  errors,
}: ShopLocalizationSectionProps) {
  const handleMappingChange = (
    index: number,
    field: "key" | "value",
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onUpdateMapping(index, field, event.target.value);
  };

  const handleLocaleOverrideKeyChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onUpdateLocaleOverride(index, "key", event.target.value);
  };

  const handleLocaleOverrideValueChange = (
    index: number,
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    onUpdateLocaleOverride(index, "value", event.target.value);
  };

  return (
    <Card className="col-span-full">
      <CardContent className="space-y-6 p-6">
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-medium">Filter mappings</h2>
            <p className="text-sm text-muted-foreground">
              Connect storefront filters to catalog fields.
            </p>
          </div>
          <div className="space-y-2">
            {mappings.map((row, index) => (
              <div key={`${row.key}-${index}`} className="flex flex-col gap-2 sm:flex-row">
                <Input
                  name="filterMappingsKey"
                  value={row.key}
                  placeholder="Filter"
                  onChange={(event) => handleMappingChange(index, "key", event)}
                />
                <Input
                  name="filterMappingsValue"
                  value={row.value}
                  placeholder="Mapping"
                  onChange={(event) => handleMappingChange(index, "value", event)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onRemoveMapping(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" onClick={onAddMapping}>
              Add Mapping
            </Button>
            {errors.filterMappings && (
              <p className="text-sm text-red-600">
                {errors.filterMappings.join("; ")}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-medium">Locale overrides</h2>
            <p className="text-sm text-muted-foreground">
              Customize locale routing for specific paths.
            </p>
          </div>
          <div className="space-y-2">
            {localeOverrides.map((row, index) => (
              <div key={`${row.key}-${index}`} className="flex flex-col gap-2 sm:flex-row">
                <Input
                  name="localeOverridesKey"
                  value={row.key}
                  placeholder="Field"
                  onChange={(event) => handleLocaleOverrideKeyChange(index, event)}
                />
                <select
                  name="localeOverridesValue"
                  value={row.value}
                  onChange={(event) => handleLocaleOverrideValueChange(index, event)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select locale</option>
                  {supportedLocales.map((locale) => (
                    <option key={locale} value={locale}>
                      {locale}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onRemoveLocaleOverride(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" onClick={onAddLocaleOverride}>
              Add Override
            </Button>
            {errors.localeOverrides && (
              <p className="text-sm text-red-600">
                {errors.localeOverrides.join("; ")}
              </p>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
