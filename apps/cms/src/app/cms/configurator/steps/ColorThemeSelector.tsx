"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TokenMap } from "../../wizard/tokenUtils";
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
  tagFilter?: string;
}

export default function ColorThemeSelector({ tokens, baseTokens, onChange, tagFilter }: Props) {
  const themes = useMemo(() => data as unknown as ColorTheme[], []);

  const allTags = useMemo(() => {
    const t = new Set<string>();
    themes.forEach((p) => (p.tags || []).forEach((tag) => t.add(tag)));
    return Array.from(t).sort();
  }, [themes]);

  const [internalTag, setInternalTag] = useState(tagFilter ?? "");
  useEffect(() => {
    if (tagFilter !== undefined) setInternalTag(tagFilter);
  }, [tagFilter]);

  const filtered = useMemo(() => {
    const active = tagFilter ?? internalTag;
    if (!active) return themes;
    return themes.filter((p) => (p.tags || []).some((t) => t === active));
  }, [themes, internalTag, tagFilter]);

  const applyTheme = useCallback(
    (t: ColorTheme) => {
      const next = { ...tokens } as Record<string, string>;
      // Apply light tokens
      Object.entries(t.light).forEach(([k, v]) => {
        if (baseTokens[k] !== v) next[k] = v; else delete next[k];
      });
      // Apply paired dark tokens by writing to the `-dark` variants
      Object.entries(t.dark).forEach(([k, v]) => {
        const dk = `${k}-dark`;
        if (baseTokens[dk] !== v) next[dk] = v; else delete next[dk];
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
      <h2 className="text-lg font-semibold">Color Themes</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((t) => (
          <div key={t.id} className="rounded border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="truncate text-sm font-medium">{t.name}</div>
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => applyTheme(t)}>
                Use theme
              </button>
            </div>
            {t.tags && t.tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                {t.tags.map((tg) => (
                  <span key={tg} className="rounded border px-1">{tg}</span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border p-2">
                <div className="mb-1 text-xs text-muted-foreground">Light</div>
                <div className="h-10 w-full">
                  {swatch(t.light)}
                </div>
              </div>
              <div className="rounded border p-2">
                <div className="mb-1 text-xs text-muted-foreground">Dark</div>
                <div className="h-10 w-full">
                  {swatch(t.dark)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
