"use client";

import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import { FormField } from "@/components/molecules/FormField";
import type { MappingRow } from "@/hooks/useMappingRows";

const DEFAULT_LOCALES = ["en", "de", "it"] as const;

type ShopLocalizationErrors = Partial<Record<"localeOverrides", string[]>>;

export interface ShopLocalizationSectionProps {
  overrides: MappingRow[];
  errors?: ShopLocalizationErrors | Record<string, string[]>;
  onAddOverride: () => void;
  onUpdateOverride: (
    index: number,
    field: "key" | "value",
    value: string,
  ) => void;
  onRemoveOverride: (index: number) => void;
  availableLocales?: readonly string[];
}

function formatErrors(
  errors: ShopLocalizationSectionProps["errors"],
  key: string,
) {
  if (!errors) return undefined;
  const messages = errors[key];
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

export default function ShopLocalizationSection({
  overrides,
  errors,
  onAddOverride,
  onUpdateOverride,
  onRemoveOverride,
  availableLocales = DEFAULT_LOCALES,
}: ShopLocalizationSectionProps) {
  const listError = formatErrors(errors, "localeOverrides");

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Localization overrides</h3>
          <p className="text-sm text-muted-foreground">
            Redirect key storefront entry points to locale-specific experiences when needed.
          </p>
        </div>

        <div className="space-y-4">
          {overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No locale overrides configured.
            </p>
          ) : (
            overrides.map((row, index) => {
              const keyId = `locale-override-key-${index}`;
              const valueId = `locale-override-value-${index}`;
              return (
                <div
                  key={keyId}
                  className="grid gap-4 sm:grid-cols-[2fr,1fr,auto] sm:items-end"
                >
                  <FormField label="Field key" htmlFor={keyId}>
                    <Input
                      id={keyId}
                      name="localeOverridesKey"
                      value={row.key}
                      onChange={(event) =>
                        onUpdateOverride(index, "key", event.target.value)
                      }
                      placeholder="/collections/new"
                    />
                  </FormField>
                  <FormField label="Locale" htmlFor={valueId}>
                    <Select
                      name="localeOverridesValue"
                      value={row.value === "" ? undefined : row.value}
                      onValueChange={(value) =>
                        onUpdateOverride(index, "value", value)
                      }
                    >
                      <SelectTrigger id={valueId}>
                        <SelectValue placeholder="Select locale" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLocales.map((locale) => (
                          <SelectItem key={locale} value={locale}>
                            {locale}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onRemoveOverride(index)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            onClick={onAddOverride}
            className="w-full sm:w-auto"
          >
            Add locale override
          </Button>
          {listError ? (
            <p className="text-sm text-destructive">
              <span role="alert">{listError}</span>
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
