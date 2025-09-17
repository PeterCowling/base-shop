"use client";

import { Card, CardContent } from "@ui/components";
import type { MappingRowsController } from "../useShopEditorSubmit";
import { MappingListField } from "../components/MappingListField";

const DEFAULT_LOCALES = ["en", "de", "it"] as const;

export type ShopLocalizationSectionErrors = Partial<
  Record<"localeOverrides", string[]>
>;

export interface ShopLocalizationSectionProps {
  readonly localeOverrides: MappingRowsController;
  readonly errors?: ShopLocalizationSectionErrors;
  readonly availableLocales?: readonly string[];
}

export default function ShopLocalizationSection({
  localeOverrides,
  errors,
  availableLocales = DEFAULT_LOCALES,
}: ShopLocalizationSectionProps) {
  const localeOptions = availableLocales.map((locale) => ({
    label: locale,
    value: locale,
  }));
  const errorId =
    errors?.localeOverrides && errors.localeOverrides.length > 0
      ? "locale-overrides-error"
      : undefined;

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

        <MappingListField
          controller={localeOverrides}
          keyField={{
            label: "Field key",
            name: "localeOverridesKey",
            placeholder: "/collections/new",
          }}
          valueField={{
            type: "select",
            label: "Locale",
            name: "localeOverridesValue",
            placeholder: "Select locale",
            options: localeOptions,
          }}
          addLabel="Add locale override"
          emptyState="No locale overrides configured."
          errors={errors?.localeOverrides}
          errorId={errorId}
        />
      </CardContent>
    </Card>
  );
}
