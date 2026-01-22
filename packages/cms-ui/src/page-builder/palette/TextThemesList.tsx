"use client";

import type { CSSProperties } from "react";

import { Inline, Stack } from "@acme/design-system/primitives";
import { useTranslations } from "@acme/i18n";

import type { TextTheme } from "../textThemes";

interface Props {
  textThemes: TextTheme[];
  buildPreviewStyle: (theme: TextTheme) => CSSProperties;
  onApply: (theme: TextTheme) => void;
}

export default function TextThemesList({ textThemes, buildPreviewStyle, onApply }: Props) {
  const t = useTranslations();
  if (textThemes.length === 0) return null;
  return (
    <div className="space-y-2">
      <Inline className="justify-between" gap={2}>
        <h4 className="font-semibold capitalize">{t("cms.builder.textThemes.title")}</h4>
        <span className="text-xs text-muted-foreground">{t("cms.builder.textThemes.applyHint")}</span>
      </Inline>
      <Stack gap={2}>
        {textThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className="rounded border p-2 text-start text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-10 min-w-10"
            onClick={() => onApply(theme)}
          >
            <Stack gap={1}>
              <span className="font-medium">{theme.label}</span>
              {/* Preview requires inline style from theme builder */}
              { }
              <span aria-hidden="true" className="truncate" style={buildPreviewStyle(theme)}>
                {t("cms.builder.textThemes.sample")}
              </span>
            </Stack>
          </button>
        ))}
      </Stack>
    </div>
  );
}
