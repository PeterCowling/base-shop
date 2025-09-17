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
import type { MappingRow } from "@/hooks/useMappingRows";

const DEFAULT_LOCALES = ["en", "de", "it"] as const;

type LocalizationErrorKey = "localeOverrides";

export type LocalizationSectionErrors = Partial<
  Record<LocalizationErrorKey, string[]>
>;

export interface LocalizationSectionProps {
  values: MappingRow[];
  errors?: LocalizationSectionErrors;
  onAdd: () => void;
  onUpdate: (index: number, field: "key" | "value", value: string) => void;
  onRemove: (index: number) => void;
  availableLocales?: readonly string[];
}

function formatError(messages?: string[]) {
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

export default function LocalizationSection({
  values,
  errors,
  onAdd,
  onUpdate,
  onRemove,
  availableLocales = DEFAULT_LOCALES,
}: LocalizationSectionProps) {
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
          {values.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No locale overrides configured.
            </p>
          ) : (
            values.map((row, index) => {
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
                        onUpdate(index, "key", event.target.value)
                      }
                      placeholder="/collections/new"
                    />
                  </FormField>
                  <FormField label="Locale" htmlFor={valueId}>
                    <Select
                      name="localeOverridesValue"
                      value={row.value === "" ? undefined : row.value}
                      onValueChange={(value) => onUpdate(index, "value", value)}
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
                    onClick={() => onRemove(index)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" onClick={onAdd} className="w-full sm:w-auto">
            Add locale override
          </Button>
          {errors?.localeOverrides ? (
            <p className="text-sm text-destructive">
              {formatError(errors.localeOverrides)}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
