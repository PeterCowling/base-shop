"use client";

import { Card, CardContent } from "@/components/atoms/shadcn";
import { useTranslations } from "@acme/i18n";
import type { MappingRowsController } from "../useShopEditorSubmit";

import MappingListField, {
  type MappingListFieldErrors,
  type MappingListFieldSelectOption,
} from "../components/MappingListField";

const DEFAULT_LOCALES = ["en"] as const;

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
  const t = useTranslations();
  const options: readonly MappingListFieldSelectOption[] =
    availableLocales.map((locale) => ({ label: locale, value: locale }));

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t("Localization overrides")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "Redirect key storefront entry points to locale-specific experiences when needed.",
            )}
          </p>
        </div>

        <MappingListField
          controller={localeOverrides}
          idPrefix={"locale-override" /* i18n-exempt: DOM id prefix, not user-visible copy */}
          keyField={{
            field: "key",
            label: String(t("Field key")),
            name: "localeOverridesKey",
            placeholder: String(t("/collections/new")),
          }}
          valueField={{
            field: "value",
            kind: "select",
            label: String(t("Locale")),
            name: "localeOverridesValue",
            placeholder: String(t("Select locale")),
            options,
          }}
          emptyMessage={String(t("No locale overrides configured."))}
          addButtonLabel={String(t("Add locale override"))}
          removeButtonLabel={String(t("Remove"))}
          errors={errors?.localeOverrides}
          rowClassName={
            "sm:grid-cols-[2fr,1fr,auto]" /* i18n-exempt: CSS utility classes, not user copy */
          }
        />
      </CardContent>
    </Card>
  );
}
