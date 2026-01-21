"use client";

import { type ChangeEvent,useState } from "react";

import { useThemePresets } from "./useThemePresets";

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
    setTheme(newTheme);
    setOverrides({});
    setThemeDefaults(tokensByThemeState[newTheme]);
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

