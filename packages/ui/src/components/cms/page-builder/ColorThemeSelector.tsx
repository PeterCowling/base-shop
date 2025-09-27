"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Grid as DSGrid } from "../../atoms/primitives/Grid";
import { Inline as DSInline } from "../../atoms/primitives/Inline";
import type { TokenMap } from "../../../hooks/useTokenEditor";
import data from "./color-themes.json";

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
  const themes = useMemo(() => data as unknown as ColorTheme[], []);

  // i18n-exempt — editor-only chooser; keep copy local
  /* i18n-exempt */
  const t = (s: string) => s;

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

  const parseHslLightness = (hsl: string | undefined) => {
    if (!hsl) return 50;
    const parts = hsl.trim().split(/\s+/);
    const l = parts[2]?.replace("%", "");
    const n = Number(l);
    return Number.isFinite(n) ? n : 50;
  };

  const isThemeSelected = useCallback((t: ColorTheme) => {
    const lightMatch = Object.entries(t.light).every(([k, v]) => (tokens as Record<string, string>)[k] === v);
    const darkMatch = Object.entries(t.dark).every(([k, v]) => (tokens as Record<string, string>)[`${k}-dark`] === v);
    return lightMatch && darkMatch;
  }, [tokens]);

  const UsagePreview = ({ mode, palette }: { mode: "Light" | "Dark"; palette: Record<string, string> }) => {
    const bg = palette["--color-bg"]; const fg = palette["--color-fg"];
    const primary = palette["--color-primary"]; const primaryFg = palette["--color-primary-fg"];
    const accent = palette["--color-accent"]; const muted = palette["--color-muted"];
    const accentText = parseHslLightness(accent) > 60 ? "hsl(var(--color-fg))" : "hsl(var(--color-bg))";
    const mutedText = parseHslLightness(muted) > 50 ? "hsl(var(--color-fg))" : "hsl(var(--color-bg))";
    return (
      <div className="rounded border p-2">
        {/* i18n-exempt: visual preview label only */}
        <div className="mb-1 text-xs text-muted-foreground">{mode}</div>
        <div className="space-y-2" style={{ backgroundColor: `hsl(${bg})`, color: `hsl(${fg})` }}>
          <div className="rounded border p-2" style={{ borderColor: `hsl(${muted})` }}>
            {/* i18n-exempt: preview-only text */}
            <div className="text-sm font-medium">Card title</div>
            {/* i18n-exempt: preview-only text */}
            <div className="text-xs opacity-80">Body text on surface</div>
            <DSInline className="mt-2" gap={2}>
              {/* i18n-exempt: preview-only text */}
              <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: `hsl(${primary})`, color: `hsl(${primaryFg})` }}>Primary button</span>
              {/* i18n-exempt: preview-only text */}
              <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: `hsl(${accent})`, color: accentText }}>Accent badge</span>
              {/* i18n-exempt: preview-only text */}
              <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: `hsl(${muted})`, color: mutedText }}>Muted chip</span>
            </DSInline>
          </div>
        </div>
        <DSGrid className="mt-2" cols={6} gap={1}>
          {[bg, fg, primary, primaryFg, accent, muted].map((c, i) => (
            <div
              key={i}
              className="h-4 w-full rounded"
              style={{ backgroundColor: `hsl(${c})`, border: i === 1 ? "1px solid hsl(var(--color-fg) / 0.125)" : undefined }}
            />
          ))}
        </DSGrid>
        <DSGrid className="mt-1 text-xs text-muted-foreground" cols={6} gap={1}>
          {/* i18n-exempt: token keys */}
          {['bg','fg','primary','primary-fg','accent','muted'].map((l) => (<div key={l} className="text-center">{l}</div>))}
        </DSGrid>
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

  // Swatch helper not currently used; removed to satisfy unused-var lint

  // i18n-exempt: CSS utility class strings only (non-user-facing)
  const CARD_BASE = "rounded border p-3"; // i18n-exempt: CSS classes
  const CARD_SELECTED = "border-primary ring-1 ring-primary/40"; // i18n-exempt: CSS classes

  return (
    <section className="space-y-3">
      {/* i18n-exempt: admin-only heading in builder UI */}
      <h3 className="text-sm font-semibold">{t("Color Themes")}</h3>
      <DSGrid cols={1} gap={3}>
        {filtered.map((theme) => (
          <div
            key={theme.id}
            className={`${CARD_BASE} ${isThemeSelected(theme) ? CARD_SELECTED : ""}`}
          >
            <DSInline className="mb-2 justify-between" gap={2}>
              <div className="truncate text-sm font-medium">{theme.name}</div>
              <button type="button" className="rounded border px-3 py-1 text-xs min-h-10 min-w-10" onClick={() => applyTheme(theme)}>
                {/* i18n-exempt: admin-only action label */}
                {t("Use theme")}
              </button>
            </DSInline>
            {isThemeSelected(theme) && (
              // i18n-exempt: admin-only status chip
              <div className="mb-2 inline-block rounded-full border border-primary bg-primary/10 px-2 py-0.5 text-xs text-primary">{t("Selected")}</div>
            )}
            {theme.tags && theme.tags.length > 0 && (
              <DSInline className="mb-2 flex-wrap text-xs text-muted-foreground" gap={1}>
                {theme.tags.map((tg) => (
                  <span key={tg} className="rounded border px-1">{tg}</span>
                ))}
              </DSInline>
            )}
            <DSGrid cols={2} gap={2}>
              <UsagePreview mode="Light" palette={theme.light} />
              <UsagePreview mode="Dark" palette={theme.dark} />
            </DSGrid>
          </div>
        ))}
      </DSGrid>
    </section>
  );
}
