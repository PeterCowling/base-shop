"use client";
/* i18n-exempt file -- DS-4287 CSS class tokens only [ttl=2026-01-01] */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Grid, Inline } from "@acme/ui/components/atoms/primitives";
import type { TokenMap } from "../../wizard/tokenUtils";
import data from "./color-themes.json";
import { useTranslations } from "@acme/i18n";

type ColorTheme = {
  id: string;
  name: string;
  tags?: string[];
  light: Record<string, string>;
  dark: Record<string, string>;
};

interface Props {
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (next: TokenMap) => void;
  tagFilters?: string[];
}

export default function ColorThemeSelector({ tokens, baseTokens, onChange, tagFilters }: Props) {
  const t = useTranslations();
  const themes = useMemo(() => data as unknown as ColorTheme[], []);

  const _allTags = useMemo(() => {
    const t = new Set<string>();
    themes.forEach((p) => (p.tags || []).forEach((tag) => t.add(tag)));
    return Array.from(t).sort();
  }, [themes]);

  const [internalTag, setInternalTag] = useState<string>("");
  useEffect(() => {
    if (tagFilters !== undefined) setInternalTag("");
  }, [tagFilters]);

  const filtered = useMemo(() => {
    const active = tagFilters && tagFilters.length > 0 ? tagFilters : (internalTag ? [internalTag] : []);
    if (!active || active.length === 0) return themes;
    return themes.filter((p) => (p.tags || []).some((t) => active.includes(t)));
  }, [themes, internalTag, tagFilters]);

  const parseHslLightness = (hsl: string | undefined) => {
    if (!hsl) return 50;
    const parts = hsl.trim().split(/\s+/);
    const l = parts[2]?.replace("%", "");
    const n = Number(l);
    return Number.isFinite(n) ? n : 50;
  };

  const isThemeSelected = useCallback((t: ColorTheme) => {
    // Determine if the current merged tokens match this theme's key values
    const lightMatch = Object.entries(t.light).every(([k, v]) => (tokens as Record<string, string>)[k] === v);
    const darkMatch = Object.entries(t.dark).every(([k, v]) => (tokens as Record<string, string>)[`${k}-dark`] === v);
    return lightMatch && darkMatch;
  }, [tokens]);

  const UsagePreview = ({ mode, palette }: { mode: "Light" | "Dark"; palette: Record<string, string> }) => {
    const bg = palette["--color-bg"]; const fg = palette["--color-fg"];
    const primary = palette["--color-primary"]; const primaryFg = palette["--color-primary-fg"];
    const accent = palette["--color-accent"]; const muted = palette["--color-muted"];
    const accentTextToken = parseHslLightness(accent) > 60 ? "var(--color-fg)" : "var(--color-bg)";
    const mutedTextToken = parseHslLightness(muted) > 50 ? "var(--color-fg)" : "var(--color-bg)";
    return (
      <div className="rounded border p-2">
        <div className="mb-1 text-xs text-muted-foreground">
          {mode === "Light" ? t("cms.builder.colorThemes.mode.light") : t("cms.builder.colorThemes.mode.dark")}
        </div>
        <div className="space-y-2" style={{ backgroundColor: `hsl(${bg})`, color: `hsl(${fg})` }}>
          <div className="rounded border p-2" style={{ borderColor: `hsl(${muted})` }}>
            <div className="text-sm font-medium">{t("cms.builder.colorThemes.preview.cardTitle")}</div>
            <div className="text-xs opacity-80">{t("cms.builder.colorThemes.preview.bodyText")}</div>
            <Inline className="mt-2" gap={2} alignY="center">
              <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: `hsl(${primary})`, color: `hsl(${primaryFg})` }}>{t("cms.builder.colorThemes.preview.primaryButton")}</span>
              <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: `hsl(${accent})`, color: `hsl(${accentTextToken})` }}>{t("cms.builder.colorThemes.preview.accentBadge")}</span>
              <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: `hsl(${muted})`, color: `hsl(${mutedTextToken})` }}>{t("cms.builder.colorThemes.preview.mutedChip")}</span>
            </Inline>
          </div>
        </div>
        <Grid className="mt-2" cols={6} gap={1}>
          {[bg, fg, primary, primaryFg, accent, muted].map((c, i) => (
            <div
              key={i}
              className="h-4 w-full rounded"
              style={{
                backgroundColor: `hsl(${c})`,
                border: i === 1 ? "1px solid hsl(var(--color-fg) / 0.125)" : undefined,
              }}
            />
          ))}
        </Grid>
        <Grid className="mt-1 text-xs text-muted-foreground" cols={6} gap={1}>
          {["bg", "fg", "primary", "primary-fg", "accent", "muted"].map((l) => (
            <div key={l} className="text-center">{t(`cms.builder.colorThemes.preview.legend.${l}` as const)}</div>
          ))}
        </Grid>
      </div>
    );
  };

  const applyTheme = useCallback(
    (t: ColorTheme) => {
      const next = { ...tokens } as Record<string, string>;
      // Apply light tokens
      Object.entries(t.light).forEach(([k, v]) => {
        const key = k as keyof TokenMap;
        if (baseTokens[key] !== v) next[k] = v; else delete next[k];
      });
      // Apply paired dark tokens by writing to the `-dark` variants
      Object.entries(t.dark).forEach(([k, v]) => {
        const dk = `${k}-dark` as keyof TokenMap & string;
        if ((baseTokens as Record<string, string>)[dk] !== v) next[dk] = v; else delete next[dk];
      });
      onChange(next as TokenMap);
    },
    [onChange, tokens, baseTokens]
  );

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t("cms.builder.colorThemes.selectExistingTheme")}</h2>
      <Grid cols={1} gap={3}>
        {filtered.map((theme) => (
          <div key={theme.id} className={`rounded border p-3 ${isThemeSelected(theme) ? "border-primary ring-1 ring-primary/40" : ""}`}>
            <Inline className="mb-2" alignY="center" gap={2}>
              <div className="truncate text-sm font-medium">{theme.name}</div>
              <button
                type="button"
                className="min-h-12 min-w-12 rounded border px-3 text-xs"
                onClick={() => applyTheme(theme)}
              >
                {t("cms.builder.colorThemes.useTheme")}
              </button>
            </Inline>
            {isThemeSelected(theme) && (
              <div className="mb-2 inline-block rounded-full border border-primary bg-primary/10 px-2 py-0.5 text-xs text-primary">{t("cms.builder.colorThemes.selected")}</div>
            )}
            {theme.tags && theme.tags.length > 0 && (
              <Inline className="mb-2 text-xs text-muted-foreground" gap={1} wrap>
                {theme.tags.map((tg) => (
                  <span key={tg} className="rounded border px-1">{tg}</span>
                ))}
              </Inline>
            )}
            <Grid cols={2} gap={2}>
              <UsagePreview mode="Light" palette={theme.light} />
              <UsagePreview mode="Dark" palette={theme.dark} />
            </Grid>
          </div>
        ))}
      </Grid>
    </section>
  );
}
