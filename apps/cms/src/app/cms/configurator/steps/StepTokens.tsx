"use client";

import { Button } from "@/components/atoms/shadcn";
// Simplified step: keep typography, add color theme selector
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { type TokenMap } from "../../wizard/tokenUtils";
import { useConfigurator } from "../ConfiguratorContext";
import type { ConfiguratorStepProps } from "@/types/configurator";
import TypographySelector from "./TypographySelector";
import ColorThemeSelector from "./ColorThemeSelector";
import colorThemesData from "./color-themes.json";
import presetData from "@ui/components/cms/style/presets.json";
import { patchShopTheme } from "../../wizard/services/patchTheme";

export default function StepTokens(_: ConfiguratorStepProps): React.JSX.Element {
  const [, markComplete] = useStepCompletion("tokens");
  const router = useRouter();
  const { state, themeDefaults, themeOverrides, setThemeOverrides } = useConfigurator();
  const tokens = { ...themeDefaults, ...themeOverrides } as TokenMap;
  const [tagFilter, setTagFilter] = useState<string>("");

  const pendingRef = useRef<Record<string, string>>({});
  const timeoutRef = useRef<number | null>(null);

  const scheduleSave = useCallback((overrides: Record<string, string>) => {
    if (!state?.shopId) return; // Only persist for existing shops
    pendingRef.current = overrides;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(async () => {
      try {
        await patchShopTheme(state.shopId!, {
          themeOverrides: pendingRef.current,
          themeDefaults: themeDefaults as Record<string, string>,
        });
      } catch {
        // Ignore network errors in-editor; status bar will still reflect unsaved state
      } finally {
        pendingRef.current = {};
      }
    }, 500);
  }, [state?.shopId, themeDefaults]);

  const handleChange = (next: TokenMap) => {
    const overrides: TokenMap = { ...next };
    for (const key of Object.keys(overrides) as Array<keyof TokenMap & string>) {
      if (overrides[key] === themeDefaults[key]) {
        delete overrides[key];
      }
    }
    setThemeOverrides(overrides);
    scheduleSave(overrides as Record<string, string>);
  };
  // Union of tags across font pairings and color themes for the shared filter
  const allTags = (() => {
    const t = new Set<string>();
    const pairs = (presetData as any[]).filter((p) => typeof p?.id === "string" && p.id.startsWith("type-"));
    pairs.forEach((p) => (p.tags || []).forEach((tg: string) => t.add(tg)));
    (colorThemesData as Array<{ tags?: string[] }>).forEach((p) => (p.tags || []).forEach((tg) => t.add(tg)));
    return Array.from(t).sort();
  })();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Fonts and Colors</h2>
      {/* Shared tag filter for both selectors */}
      <div className="flex items-center gap-2 text-sm">
        <label className="text-muted-foreground">Filter by tag</label>
        <select className="rounded border p-1" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">All</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      {/* Font pairing selector */}
      <TypographySelector
        tokens={tokens}
        baseTokens={themeDefaults}
        onChange={handleChange}
        tagFilter={tagFilter}
        hideTagFilter
      />
      {/* Prebuilt color theme selector (light/dark paired) */}
      <ColorThemeSelector
        tokens={tokens}
        baseTokens={themeDefaults}
        onChange={handleChange}
        tagFilter={tagFilter}
      />
      <div className="flex justify-end">
        <Button
          data-cy="save-return"
          onClick={() => {
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          Save & return
        </Button>
      </div>
    </div>
  );
}
