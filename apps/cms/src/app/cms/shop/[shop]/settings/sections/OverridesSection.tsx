"use client";

import { Button, Card, CardContent, FormField, Input } from "@ui";
import Link from "next/link";
import { resetThemeOverride } from "@cms/actions/shops.server";
import { renderError, type MappingListProps } from "./shared";

export interface ThemeTokenRow {
  token: string;
  defaultValue: string;
  overrideValue?: string;
}

export interface ThemeOverridesProps {
  rows: ThemeTokenRow[];
  defaults: Record<string, string>;
  overrides: Record<string, string>;
  errors: Partial<Record<"themeDefaults" | "themeOverrides", string[]>>;
}

export interface OverridesSectionProps {
  shop: string;
  priceOverrides: MappingListProps;
  theme: ThemeOverridesProps;
}

export function OverridesSection({ shop, priceOverrides, theme }: OverridesSectionProps) {
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="space-y-6">
        <FormField
          label="Price overrides"
          error={renderError(priceOverrides.error)}
        >
          <div className="space-y-3">
            {priceOverrides.rows.map((row, index) => {
              const keyId = `price-override-${index}-key`;
              const valueId = `price-override-${index}-value`;
              return (
                <div
                  key={`${keyId}-${valueId}`}
                  className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center"
                >
                  <Input
                    id={keyId}
                    name="priceOverridesKey"
                    value={row.key}
                    placeholder="Locale"
                    onChange={(event) =>
                      priceOverrides.onUpdate(index, "key", event.target.value)
                    }
                    aria-invalid={priceOverrides.error ? true : undefined}
                    className="md:flex-1"
                  />
                  <Input
                    id={valueId}
                    type="number"
                    name="priceOverridesValue"
                    value={row.value}
                    placeholder="Price"
                    onChange={(event) =>
                      priceOverrides.onUpdate(index, "value", event.target.value)
                    }
                    aria-invalid={priceOverrides.error ? true : undefined}
                    className="md:flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => priceOverrides.onRemove(index)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
            <Button type="button" variant="outline" onClick={priceOverrides.onAdd}>
              Add override
            </Button>
          </div>
        </FormField>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Theme tokens</h3>
            <Link
              href={`/cms/shop/${shop}/themes`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Edit theme
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-1">Token</th>
                  <th className="px-2 py-1">Values</th>
                  <th className="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {theme.rows.map(({ token, defaultValue, overrideValue }) => {
                  const hasOverride = overrideValue !== undefined;
                  const changed = hasOverride && overrideValue !== defaultValue;
                  return (
                    <tr key={token} className={changed ? "bg-yellow-50" : undefined}>
                      <td className="border-t px-2 py-1 font-medium">{token}</td>
                      <td className="border-t px-2 py-1">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="font-mono">{defaultValue}</span>
                            <span className="text-xs text-muted-foreground">default</span>
                          </div>
                          {hasOverride && (
                            <div className="flex items-center gap-1">
                              <span className="font-mono">{overrideValue}</span>
                              <span className="text-xs text-muted-foreground">override</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border-t px-2 py-1">
                        {hasOverride && (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              (
                                resetThemeOverride as unknown as (
                                  shop: string,
                                  token: string,
                                  formData: FormData,
                                ) => void
                              )(shop, token, new FormData());
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              className="h-auto p-0 text-primary hover:bg-transparent"
                            >
                              Reset
                            </Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <input
            type="hidden"
            name="themeDefaults"
            value={JSON.stringify(theme.defaults ?? {})}
          />
          <input
            type="hidden"
            name="themeOverrides"
            value={JSON.stringify(theme.overrides ?? {})}
          />
          {renderError(theme.errors.themeDefaults)}
          {renderError(theme.errors.themeOverrides)}
        </section>
      </CardContent>
    </Card>
  );
}

export default OverridesSection;
