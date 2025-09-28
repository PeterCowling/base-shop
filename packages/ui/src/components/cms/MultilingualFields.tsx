// packages/ui/components/cms/MultilingualFields.tsx
"use client";

import { Input, Textarea } from "../atoms/shadcn";
import { Grid, Stack } from "../atoms/primitives";
import type { ProductPublication } from "@acme/types";
import type { Locale } from "@acme/i18n/locales";
import { useTranslations } from "@acme/i18n";
import { memo } from "react";

interface Props {
  locales: readonly Locale[];
  /**
   * Only the translated fields are required for this component, so accept a
   * narrow subset of the product instead of the full `ProductPublication`
   * which demands many unrelated properties (e.g. sku, status, etc.).
   */
  product: Pick<ProductPublication, "title" | "description">;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const label: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  it: "Italiano",
};

function MultilingualFieldsInner({ locales, product, onChange }: Props) {
  const t = useTranslations();
  return (
    <Grid cols={1} gap={6} className="@md:grid-cols-3">
      {locales.map((l) => (
        <Stack key={l} gap={4}>
          <h3 className="text-sm font-medium">{label[l]}</h3>

          <Stack gap={1}>
            <label htmlFor={`title_${l}`}>{t("fields.title")}</label>
            <Input
              id={`title_${l}`}
              name={`title_${l}`}
              value={product.title[l]}
              onChange={onChange}
            />
          </Stack>

          <Stack gap={1}>
            <label htmlFor={`desc_${l}`}>{t("fields.description")}</label>
            <Textarea
              id={`desc_${l}`}
              rows={4}
              name={`desc_${l}`}
              value={product.description[l]}
              onChange={onChange}
            />
          </Stack>
        </Stack>
      ))}
    </Grid>
  );
}

export default memo(MultilingualFieldsInner);
