"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslations } from "@acme/i18n";

import type { TokenMap } from "../../../hooks/useTokenEditor";
import { Grid as DSGrid } from "../../atoms/primitives/Grid";
import { Inline as DSInline } from "../../atoms/primitives/Inline";

import data from "./color-themes.json";

type ColorTheme = {
  id: string;
  name: string;
  tags?: string[];
  light: Record<string, string>;
  dark: Record<string, string>;
};

// Extracted helpers to avoid unstable nested component definitions
const parseHslLightness = (hsl: string | undefined) => {
  if (!hsl) return 50;
  const parts = hsl.trim().split(/\s+/);
  const l = parts[2]?.replace("%", "");
  const n = Number(l);
  return Number.isFinite(n) ? n : 50;
};

const UsagePreview = ({ mode, palette }: { mode: "Light" | "Dark"; palette: Record<string, string> }) => {
  const bg = palette["--color-bg"]; const fg = palette["--color-fg"];
  const primary = palette["--color-primary"]; const primaryFg = palette["--color-primary-fg"];
  const accent = palette["--color-accent"]; const muted = palette["--color-muted"];
  const accentText = parseHslLightness(accent) > 60 ? "hsl(var(--color-fg))" : "hsl(var(--color-bg))";
  const mutedText = parseHslLightness(muted) > 50 ? "hsl(var(--color-fg))" : "hsl(var(--color-bg))";
  const swatches = [
    { key: "bg", v: bg },
    { key: "fg", v: fg },
    { key: "primary", v: primary },
    { key: "primary-fg", v: primaryFg },
    { key: "accent", v: accent },
    { key: "muted", v: muted },
  ];
  return (
    <div className="rounded border p-2">
      {/* i18n-exempt: visual preview label only */}
      <div className="mb-1 text-xs text-muted-foreground">{mode}</div>
      <div
        className="space-y-2"
        // eslint-disable-next-line react/forbid-dom-props -- PB-0002: theme preview requires dynamic background/text colors
        style={{ backgroundColor: `hsl(${bg})`, color: `hsl(${fg})` }}
      >
        <div
          className="rounded border p-2"
          // eslint-disable-next-line react/forbid-dom-props -- PB-0002: theme preview requires dynamic border color
          style={{ borderColor: `hsl(${muted})` }}
        >
          <div className="text-sm font-medium">{/* i18n-exempt -- TECH-000 [ttl=2025-10-28] preview-only text */}Card title</div>
          <div className="text-xs opacity-80">{/* i18n-exempt -- TECH-000 [ttl=2025-10-28] preview-only text */}Body text on surface</div>
          <DSInline className="mt-2" gap={2}>
            <span
              className="rounded px-2 py-1 text-xs"
              // eslint-disable-next-line react/forbid-dom-props -- PB-0002: dynamic button colors from palette
              style={{ backgroundColor: `hsl(${primary})`, color: `hsl(${primaryFg})` }}
            >
              {/* i18n-exempt -- TECH-000 [ttl=2025-10-28] preview-only text */}
              Primary button
            </span>
            <span
              className="rounded px-2 py-1 text-xs"
              // eslint-disable-next-line react/forbid-dom-props -- PB-0002: dynamic badge colors from palette
              style={{ backgroundColor: `hsl(${accent})`, color: accentText }}
            >
              {/* i18n-exempt -- TECH-000 [ttl=2025-10-28] preview-only text */}
              Accent badge
            </span>
            <span
              className="rounded px-2 py-1 text-xs"
              // eslint-disable-next-line react/forbid-dom-props -- PB-0002: dynamic chip colors from palette
              style={{ backgroundColor: `hsl(${muted})`, color: mutedText }}
            >
              {/* i18n-exempt -- TECH-000 [ttl=2025-10-28] preview-only text */}
              Muted chip
            </span>
          </DSInline>
        </div>
      </div>
      <DSGrid className="mt-2" cols={6} gap={1}>
        {swatches.map((s, i) => (
          <div
            key={s.key}
            className="h-4 w-full rounded"
            // eslint-disable-next-line react/forbid-dom-props -- PB-0002: dynamic swatch background and optional border
            style={{
              backgroundColor: `hsl(${s.v})`,
              border: i === 1 ? "1px solid hsl(var(--color-fg) / 0.125)" : undefined,
            }}
          />
        ))}
      </DSGrid>
      <DSGrid className="mt-1 text-xs text-muted-foreground" cols={6} gap={1}>
        {/* i18n-exempt: token keys */}
        {swatches.map((s) => (
          <div key={s.key} className="text-center">{s.key}</div>
        ))}
      </DSGrid>
    </div>
  );
};

interface Props {
  tokens: TokenMap;
  baseTokens: TokenMap;
  onChange: (next: TokenMap) => void;
  tagFilters?: string[];
}

export default function ColorThemeSelector({ tokens, baseTokens, onChange, tagFilters }: Props) {
  const themes = useMemo(() => data as unknown as ColorTheme[], []);
  const t = useTranslations();

  // Note: tag collection available but currently unused by UI

  const [internalTag, setInternalTag] = useState<string>("");
  useEffect(() => {
    if (tagFilters !== undefined) setInternalTag("");
  }, [tagFilters]);

  const filtered = useMemo(() => {
    const active = tagFilters && tagFilters.length > 0 ? tagFilters : (internalTag ? [internalTag] : []);
    if (!active || active.length === 0) return themes;
    return themes.filter((p) => (p.tags || []).some((t) => active.includes(t)));
  }, [themes, internalTag, tagFilters]);

  

  const isThemeSelected = useCallback((t: ColorTheme) => {
    const lightMatch = Object.entries(t.light).every(([k, v]) => (tokens as Record<string, string>)[k] === v);
    const darkMatch = Object.entries(t.dark).every(([k, v]) => (tokens as Record<string, string>)[`${k}-dark`] === v);
    return lightMatch && darkMatch;
  }, [tokens]);
  

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

  // Swatch helper not currently used; removed to satisfy unused-var lint

  // i18n-exempt -- TECH-000 [ttl=2025-10-28] CSS utility class strings only (non-user-facing)
  const CARD_BASE = "rounded border p-3";
  // i18n-exempt -- TECH-000 [ttl=2025-10-28] CSS utility class strings only (non-user-facing)
  const CARD_SELECTED = "border-primary ring-1 ring-primary/40";

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{t("cms.builder.colorThemes.title")}</h3>
      <DSGrid cols={1} gap={3}>
        {filtered.map((theme) => (
          <div
            key={theme.id}
            className={`${CARD_BASE} ${isThemeSelected(theme) ? CARD_SELECTED : ""}`}
          >
            <DSInline className="mb-2 justify-between" gap={2}>
              <div className="truncate text-sm font-medium">{theme.name}</div>
              <button type="button" className="rounded border px-3 py-1 text-xs min-h-10 min-w-10" onClick={() => applyTheme(theme)}>
                {t("cms.builder.colorThemes.useTheme")}
              </button>
            </DSInline>
            {isThemeSelected(theme) && (
              <div className="mb-2 inline-block rounded-full border border-primary bg-primary/10 px-2 py-0.5 text-xs text-primary">{t("cms.builder.colorThemes.selected")}</div>
            )}
            {theme.tags && theme.tags.length > 0 && (
              <DSInline className="mb-2 flex-wrap text-xs text-muted-foreground" gap={1}>
                {theme.tags.map((tg) => (
                  <span key={tg} className="rounded border px-1">{tg}</span>
                ))}
              </DSInline>
            )}
            <DSGrid cols={2} gap={2}>
              <UsagePreview mode={String(t("cms.builder.colorThemes.mode.light")) as "Light" | "Dark"} palette={theme.light} />
              <UsagePreview mode={String(t("cms.builder.colorThemes.mode.dark")) as "Light" | "Dark"} palette={theme.dark} />
            </DSGrid>
          </div>
        ))}
      </DSGrid>
    </section>
  );
}
