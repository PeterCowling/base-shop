"use client";

import { Card, CardContent } from "@ui/components";
import type { MappingRowsController } from "../useShopEditorSubmit";

import MappingListField, {
  type MappingListFieldErrors,
  type MappingListFieldSelectOption,
} from "../components/MappingListField";

const DEFAULT_LOCALES = ["en", "de", "it"] as const;

export type ShopLocalizationSectionErrors = Partial<
  Record<"localeOverrides", MappingListFieldErrors>
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
  const options: readonly MappingListFieldSelectOption[] =
    availableLocales.map((locale) => ({ label: locale, value: locale }));

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
          idPrefix="locale-override"
          keyField={{
            field: "key",
            label: "Field key",
            name: "localeOverridesKey",
            placeholder: "/collections/new",
          }}
          valueField={{
            field: "value",
            kind: "select",
            label: "Locale",
            name: "localeOverridesValue",
            placeholder: "Select locale",
            options,
          }}
          emptyMessage="No locale overrides configured."
          addButtonLabel="Add locale override"
          removeButtonLabel="Remove"
          errors={errors?.localeOverrides}
          rowClassName="sm:grid-cols-[2fr,1fr,auto]"
        />
      </CardContent>
    </Card>
  );
}
