"use client";

import { useState } from "react";
import { savePreset, deletePreset } from "./page";
import { patchShopTheme } from "../../../wizard/services/patchTheme";

interface Args {
  shop: string;
  initialThemes: string[];
  initialTokensByTheme: Record<string, Record<string, string>>;
  presets: string[];
  theme: string;
  overrides: Record<string, string>;
  setTheme: (theme: string) => void;
  setOverrides: (next: Record<string, string>) => void;
  setThemeDefaults: (tokens: Record<string, string>) => void;
}

export function useThemePresets({
  shop,
  initialThemes,
  initialTokensByTheme,
  presets,
  theme,
  overrides,
  setTheme,
  setOverrides,
  setThemeDefaults,
}: Args) {
  const [availableThemes, setAvailableThemes] = useState(initialThemes);
  const [tokensByThemeState, setTokensByThemeState] = useState(
    initialTokensByTheme,
  );
  const [presetThemes, setPresetThemes] = useState(presets);
  const [presetName, setPresetName] = useState("");

  const handleSavePreset = async () => {
    const name = presetName.trim();
    if (!name) return;
    const tokens = { ...tokensByThemeState[theme], ...overrides };
    await savePreset(shop, name, tokens);
    setTokensByThemeState((prev) => ({ ...prev, [name]: tokens }));
    setAvailableThemes((prev) => [...prev, name]);
    setPresetThemes((prev) => [...prev, name]);
    setTheme(name);
    setOverrides({});
    setThemeDefaults(tokens);
    setPresetName("");
    try {
      await patchShopTheme(shop, {
        themeId: name,
        themeOverrides: {},
        themeDefaults: tokens,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePreset = async () => {
    await deletePreset(shop, theme);
    setTokensByThemeState((prev) => {
      const next = { ...prev };
      delete next[theme];
      return next;
    });
    setAvailableThemes((prev) => prev.filter((t) => t !== theme));
    setPresetThemes((prev) => prev.filter((t) => t !== theme));
    const fallback = initialThemes[0];
    setTheme(fallback);
    setOverrides({});
    setThemeDefaults(tokensByThemeState[fallback]);
    const fallbackDefaults = tokensByThemeState[fallback] ?? {};
    try {
      await patchShopTheme(shop, {
        themeId: fallback,
        themeOverrides: {},
        themeDefaults: fallbackDefaults,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return {
    availableThemes,
    tokensByThemeState,
    presetThemes,
    presetName,
    setPresetName,
    handleSavePreset,
    handleDeletePreset,
  };
}
