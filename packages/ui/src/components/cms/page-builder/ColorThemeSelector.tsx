"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

  const allTags = useMemo(() => {
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
    const lightMatch = Object.entries(t.light).every(([k, v]) => (tokens as Record<string, string>)[k] === v);
    const darkMatch = Object.entries(t.dark).every(([k, v]) => (tokens as Record<string, string>)[`${k}-dark`] === v);
    return lightMatch && darkMatch;
  }, [tokens]);

  const UsagePreview = ({ mode, palette }: { mode: "Light" | "Dark"; palette: Record<string, string> }) => {
    const bg = palette["--color-bg"]; const fg = palette["--color-fg"];
    const primary = palette["--color-primary"]; const primaryFg = palette["--color-primary-fg"];
    const accent = palette["--color-accent"]; const muted = palette["--color-muted"];
    const accentText = parseHslLightness(accent) > 60 ? "#000" : "#fff";
    const mutedText = parseHslLightness(muted) > 50 ? "#000" : "#fff";
    return (
      <div className="rounded border p-2">
        <div className="mb-1 text-xs text-muted-foreground">{mode}</div>
        <div className="space-y-2" style={{ backgroundColor: `hsl(${bg})`, color: `hsl(${fg})` }}>
          <div className="rounded border p-2" style={{ borderColor: `hsl(${muted})` }}>
            <div className="text-sm font-medium">Card title</div>
            <div className="text-xs opacity-80">Body text on surface</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: `hsl(${primary})`, color: `hsl(${primaryFg})` }}>Primary button</span>
              <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: `hsl(${accent})`, color: accentText }}>Accent badge</span>
              <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: `hsl(${muted})`, color: mutedText }}>Muted chip</span>
            </div>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {[bg, fg, primary, primaryFg, accent, muted].map((c, i) => (
            <div key={i} className="h-4 w-full rounded" style={{ backgroundColor: `hsl(${c})`, border: i === 1 ? "1px solid #00000020" : undefined }} />
          ))}
        </div>
        <div className="mt-1 grid grid-cols-6 gap-1 text-[9px] text-muted-foreground">
          {['bg','fg','primary','primary-fg','accent','muted'].map((l) => (<div key={l} className="text-center">{l}</div>))}
        </div>
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

  const swatch = (colors: Record<string, string>) => (
    <div className="flex h-full w-full flex-wrap overflow-hidden rounded">
      {Object.values(colors).slice(0, 4).map((c, i) => (
        <span key={i} className="h-1/2 w-1/2" style={{ backgroundColor: `hsl(${c})` }} />
      ))}
    </div>
  );

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Color Themes</h3>
      <div className="grid grid-cols-1 gap-3">
        {filtered.map((t) => (
          <div key={t.id} className={`rounded border p-3 ${isThemeSelected(t) ? "border-primary ring-1 ring-primary/40" : ""}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="truncate text-sm font-medium">{t.name}</div>
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => applyTheme(t)}>
                Use theme
              </button>
            </div>
            {isThemeSelected(t) && (
              <div className="mb-2 inline-block rounded-full border border-primary bg-primary/10 px-2 py-0.5 text-xs text-primary">Selected</div>
            )}
            {t.tags && t.tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
                {t.tags.map((tg) => (
                  <span key={tg} className="rounded border px-1">{tg}</span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <UsagePreview mode="Light" palette={t.light} />
              <UsagePreview mode="Dark" palette={t.dark} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
