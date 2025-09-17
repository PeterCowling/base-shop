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
import { FormField } from "@ui/components/molecules";
import type { MappingRowsController } from "../useShopEditorSubmit";

const DEFAULT_LOCALES = ["en", "de", "it"] as const;

export type ShopLocalizationSectionErrors = Partial<
  Record<"localeOverrides", string[]>
>;

export interface ShopLocalizationSectionProps {
  readonly localeOverrides: MappingRowsController;
  readonly errors?: ShopLocalizationSectionErrors;
  readonly availableLocales?: readonly string[];
}

function formatError(messages?: string[]) {
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

export default function ShopLocalizationSection({
  localeOverrides,
  errors,
  availableLocales = DEFAULT_LOCALES,
}: ShopLocalizationSectionProps) {
  const rows = localeOverrides.rows;
  const errorMessage = formatError(errors?.localeOverrides);
  const errorId = errorMessage ? "locale-overrides-error" : undefined;

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Localization overrides</h3>
          <p className="text-sm text-muted-foreground">
            Redirect key storefront entry points to locale-specific experiences
            when needed.
          </p>
        </div>

        <div className="space-y-4">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No locale overrides configured.
            </p>
          ) : (
            rows.map((row, index) => {
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
                        localeOverrides.update(index, "key", event.target.value)
                      }
                      placeholder="/collections/new"
                    />
                  </FormField>
                  <FormField label="Locale" htmlFor={valueId}>
                    <Select
                      name="localeOverridesValue"
                      value={row.value === "" ? undefined : row.value}
                      onValueChange={(value) =>
                        localeOverrides.update(index, "value", value)
                      }
                    >
                      <SelectTrigger id={valueId} aria-describedby={errorId}>
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
                    onClick={() => localeOverrides.remove(index)}
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
            onClick={localeOverrides.add}
            className="w-full sm:w-auto"
          >
            Add locale override
          </Button>
          {errorMessage ? (
            <p id={errorId} className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
