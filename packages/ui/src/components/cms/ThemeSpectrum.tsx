// packages/ui/src/components/cms/ThemeSpectrum.tsx
"use client";

import React from "react";
import useThemePalette from "@ui/lib/useThemePalette";
import { useTranslations } from "@acme/i18n";
import { Grid as DSGrid } from "../atoms/primitives/Grid";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const FAMILY_LABEL: Record<string, string> = {
  neutral: "Neutral",
  primary: "Primary",
  accent: "Accent",
  success: "Success",
  info: "Info",
  warning: "Warning",
  danger: "Danger",
};

export default function ThemeSpectrum(): React.JSX.Element {
  const { defaultPalette, matrix } = useThemePalette();
  const t = useTranslations();

  // Build a lookup of tokens per family/step so we can annotate usage
  const usage: Record<string, Record<number, string[]>> = {};
  (Object.keys(matrix) as Array<keyof typeof matrix>).forEach((token) => {
    const m = matrix[token]!;
    const family = m.family;
    if (!usage[family]) usage[family] = {} as Record<number, string[]>;
    // Prefer explicit step; fall back to light step if present; skip autoFg-only tokens for spectrum
    const step: number | undefined = m.step ?? m.light ?? m.dark;
    if (step) {
      const list = usage[family]![step] ?? (usage[family]![step] = []);
      list.push(String(token).replace(/^--color-/, ""));
    }
  });

  const families = Object.keys(defaultPalette) as Array<keyof typeof defaultPalette>;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{t("Create a New Theme")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("Full ramp per family with token usage highlights.")}
        </p>
      </div>
      <div className="space-y-4">
        {families.map((family) => (
          <div key={family} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{FAMILY_LABEL[String(family)] ?? String(family)}</span>
            </div>
            <DSGrid cols={12} gap={1}>
              {(Array.from({ length: 12 }) as unknown as Step[]).map((_, idx) => {
                const step = (idx + 1) as Step;
                const hsl = defaultPalette[family][step];
                const tokens = usage[String(family)]?.[step] ?? [];
                return (
                  <div key={step} className="relative">
                    {/* PB-2419: dynamic swatch background color for palette preview */}
                    {/* eslint-disable react/forbid-dom-props -- PB-2419: dynamic swatch background color */}
                    <div
                      className="h-8 w-full rounded border"
                      style={{ backgroundColor: `hsl(${hsl})` }}
                      aria-label={`${String(family)} ${step}`}
                      title={`${String(family)} ${step}${tokens.length ? ` — used by: ${tokens.join(", ")}` : ""}`}
                    />
                    {/* eslint-enable react/forbid-dom-props */}
                    {tokens.length > 0 && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="rounded bg-foreground/60 px-1 text-xs font-medium text-background mix-blend-darken">
                          {tokens.slice(0, 2).join(" · ")}{tokens.length > 2 ? ` +${tokens.length - 2}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </DSGrid>
          </div>
        ))}
      </div>
    </div>
  );
}
