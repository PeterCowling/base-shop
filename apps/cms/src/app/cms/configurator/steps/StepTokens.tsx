"use client";

import { Button } from "@/components/atoms/shadcn";
// Step now focuses on typography (fonts only)
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { type TokenMap } from "../../wizard/tokenUtils";
import { useConfigurator } from "../ConfiguratorContext";
import type { ConfiguratorStepProps } from "@/types/configurator";
import TypographySelector from "./TypographySelector";
import presetData from "@ui/components/cms/style/presets.json";
import { patchShopTheme } from "../../wizard/services/patchTheme";

export default function StepTokens(_: ConfiguratorStepProps): React.JSX.Element {
  const [, markComplete] = useStepCompletion("tokens");
  const router = useRouter();
  const { state, themeDefaults, themeOverrides, setThemeOverrides } = useConfigurator();
  const tokens = { ...themeDefaults, ...themeOverrides } as TokenMap;
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
  // Tags only from font pairings for the shared filter
  const allTags = (() => {
    const t = new Set<string>();
    const pairs = (presetData as any[]).filter((p) => typeof p?.id === "string" && p.id.startsWith("type-"));
    pairs.forEach((p) => (p.tags || []).forEach((tg: string) => t.add(tg)));
    return Array.from(t).sort();
  })();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Fonts</h2>
      {/* Shared tag filter for font pairings */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Filter by tag</span>
        {allTags.map((t) => {
          const active = selectedTags.includes(t);
          return (
            <button
              key={t}
              type="button"
              className={`rounded-full border px-2 py-0.5 text-xs ${active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
              onClick={() =>
                setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
              }
            >
              {t}
            </button>
          );
        })}
        {selectedTags.length > 0 && (
          <button
            type="button"
            className="ml-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
            onClick={() => setSelectedTags([])}
            aria-label="Clear tag filters"
          >
            Clear
          </button>
        )}
      </div>
      {/* Font pairing selector */}
      <TypographySelector
        tokens={tokens}
        baseTokens={themeDefaults}
        onChange={handleChange}
        tagFilters={selectedTags}
        hideTagFilter
        showFineTune={false}
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
