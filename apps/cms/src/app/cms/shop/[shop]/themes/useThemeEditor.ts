// apps/cms/src/app/cms/shop/[shop]/themes/useThemeEditor.ts
"use client";
import { useState, useMemo, useRef } from "react";
import { tokenGroups } from "./tokenGroups";
import { useThemePresetManager } from "./useThemePresetManager";
import { useThemeTokenSync } from "./useThemeTokenSync";
import { useBrandIntensity } from "./useBrandIntensity";

interface Options {
  shop: string;
  themes: string[];
  tokensByTheme: Record<string, Record<string, string>>;
  initialTheme: string;
  initialOverrides: Record<string, string>;
  presets: string[];
}

export function useThemeEditor({
  shop,
  themes,
  tokensByTheme,
  initialTheme,
  initialOverrides,
  presets,
}: Options) {
  const {
    theme,
    overrides,
    setOverrides,
    availableThemes,
    tokensByThemeState,
    presetThemes,
    presetName,
    setPresetName,
    handleSavePreset,
    handleDeletePreset,
    handleThemeChange,
  } = useThemePresetManager({
    shop,
    themes,
    tokensByTheme,
    initialTheme,
    initialOverrides,
    presets,
  });

  const { intensity: brandIntensity, setIntensity: setBrandIntensity } = useBrandIntensity();

  const {
    previewTokens,
    mergedTokens,
    handleOverrideChange,
    handleReset,
    handleGroupReset,
    handleResetAll,
  } = useThemeTokenSync({
    shop,
    theme,
    overrides,
    tokensByThemeState,
    setOverrides,
    brandIntensity,
  });

  const [contrastWarnings, setContrastWarnings] = useState<Record<string, string>>({});
  const overrideRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const textTokenKeys = useMemo(
    () =>
      Object.keys(tokensByThemeState[theme]).filter((k) =>
        /text|foreground/i.test(k),
      ),
    [theme, tokensByThemeState],
  );

  const bgTokenKeys = useMemo(
    () =>
      Object.keys(tokensByThemeState[theme]).filter((k) =>
        /bg|background/i.test(k),
      ),
    [theme, tokensByThemeState],
  );

  const groupedTokens = useMemo(() => {
    const tokens = tokensByThemeState[theme];
    const groups: Record<string, [string, string][]> = {};
    const used = new Set<string>();
    Object.entries(tokenGroups).forEach(([group, keys]) => {
      const arr: [string, string][] = [];
      keys.forEach((k) => {
        if (k in tokens) {
          arr.push([k, tokens[k]]);
          used.add(k);
        }
      });
      if (arr.length) groups[group] = arr;
    });
    const others: [string, string][] = [];
    Object.entries(tokens).forEach(([k, v]) => {
      if (!used.has(k)) others.push([k, v]);
    });
    if (others.length) groups.Other = others;
    return groups;
  }, [theme, tokensByThemeState]);

  const handleWarningChange = (token: string, warning: string | null) => {
    setContrastWarnings((prev) => {
      const next = { ...prev };
      if (warning) next[token] = warning;
      else delete next[token];
      return next;
    });
  };

  const handleTokenSelect = (token: string) => {
    const input = overrideRefs.current[token] as HTMLInputElement | null;
    if (input) {
      input.scrollIntoView?.({ behavior: "smooth", block: "center" });
      input.focus();
      input.showPicker?.();
      if (!input.showPicker) {
        input.click();
      }
    }
  };

  return {
    theme,
    availableThemes,
    tokensByThemeState,
    presetThemes,
    brandIntensity,
    setBrandIntensity,
    presetName,
    setPresetName,
    handleSavePreset,
    handleDeletePreset,
    overrides,
    previewTokens,
    handleOverrideChange,
    handleReset,
    handleGroupReset,
    overrideRefs,
    mergedTokens,
    groupedTokens,
    textTokenKeys,
    bgTokenKeys,
    handleWarningChange,
    contrastWarnings,
    handleTokenSelect,
    handleThemeChange,
    handleResetAll,
  };
}
