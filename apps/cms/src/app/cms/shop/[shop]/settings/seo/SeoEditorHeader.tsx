"use client";

import { Inline } from "@acme/design-system/primitives/Inline";
import { Stack } from "@acme/design-system/primitives/Stack";
import { useTranslations } from "@acme/i18n";

import { Tooltip } from "@/components/atoms";

interface SeoEditorHeaderProps {
  freeze: boolean;
  onFreezeChange(checked: boolean): void | Promise<void>;
}

export function SeoEditorHeader({ freeze, onFreezeChange }: SeoEditorHeaderProps) {
  const t = useTranslations();
  return (
    <Stack gap={4} className="sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-lg font-semibold">{t("SEO metadata")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("Manage localized titles, descriptions, and social previews.")}
        </p>
      </div>
      <Inline className="shrink-0 text-sm font-medium" alignY="center" gap={2}>
        <input
          type="checkbox"
          aria-label={t("Freeze translations")}
          checked={freeze}
          onChange={(event) => {
            void onFreezeChange(event.target.checked);
          }}
        />
        <span>{t("Freeze translations")}</span>
        <Tooltip text={String(t("Apply the same metadata across all locales."))}>?</Tooltip>
      </Inline>
    </Stack>
  );
}
