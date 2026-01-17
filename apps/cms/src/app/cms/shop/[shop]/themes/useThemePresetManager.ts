"use client";

import { useState, type ChangeEvent } from "react";
import { useThemePresets } from "./useThemePresets";
import { patchShopTheme } from "../../../wizard/services/patchTheme";

interface Options {
  shop: string;
  themes: string[];
  tokensByTheme: Record<string, Record<string, string>>;
  initialTheme: string;
  initialOverrides: Record<string, string>;
  presets: string[];
}

export function useThemePresetManager({
  shop,
  themes,
  tokensByTheme,
  initialTheme,
  initialOverrides,
  presets,
}: Options) {
  const [theme, setTheme] = useState(initialTheme);
  const [overrides, setOverrides] = useState<Record<string, string>>(initialOverrides);
  const [, setThemeDefaults] = useState<Record<string, string>>(tokensByTheme[initialTheme]);

  const {
    availableThemes,
    tokensByThemeState,
    presetThemes,
    presetName,
    setPresetName,
    handleSavePreset,
    handleDeletePreset,
  } = useThemePresets({
    shop,
    initialThemes: themes,
    initialTokensByTheme: tokensByTheme,
    presets,
    theme,
    overrides,
    setTheme,
    setOverrides,
    setThemeDefaults,
  });

  const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    const nextDefaults = tokensByThemeState[newTheme] ?? {};
    setTheme(newTheme);
    setOverrides({});
    setThemeDefaults(nextDefaults);
    void (async () => {
      try {
        await patchShopTheme(shop, {
          themeId: newTheme,
          themeOverrides: {},
          themeDefaults: nextDefaults,
        });
      } catch (err) {
        console.error(err);
      }
    })();
  };

  return {
    theme,
    setTheme,
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
  };
}
