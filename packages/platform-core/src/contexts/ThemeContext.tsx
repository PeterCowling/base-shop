"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";

import { ShopThemeProvider, useShopTheme } from "./ShopThemeContext";
import { useThemeMode } from "./ThemeModeContext";
import {
  type LegacyTheme,
  legacyThemeFrom,
  normalizeLegacyTheme,
  normalizeThemeMode,
  normalizeThemeName,
  splitLegacyTheme,
  THEME_MODE_KEY,
  THEME_NAME_KEY,
} from "./themeStorage";

export type Theme = LegacyTheme;

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function getSavedTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const storedMode = normalizeThemeMode(window.localStorage.getItem(THEME_MODE_KEY));
    const storedName = normalizeThemeName(window.localStorage.getItem(THEME_NAME_KEY));
    if (storedMode || storedName) {
      return legacyThemeFrom(storedMode ?? "system", storedName ?? "base");
    }
    const legacy = normalizeLegacyTheme(window.localStorage.getItem("theme"));
    if (legacy) return legacyThemeFrom(legacy.mode ?? "light", legacy.name ?? "base");
    return null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  try {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches // i18n-exempt -- media query string, not user-facing copy
      ? "dark"
      : "base";
  } catch {
    return "base";
  }
}

function ThemeContextBridge({ children }: { children: ReactNode }) {
  const { mode, setMode } = useThemeMode();
  const { themeName, setThemeName } = useShopTheme();

  const theme = useMemo<Theme>(() => legacyThemeFrom(mode, themeName), [mode, themeName]);

  const setTheme = useCallback((next: Theme) => {
    const { mode: nextMode, name: nextName } = splitLegacyTheme(next);
    setMode(nextMode);
    setThemeName(nextName);
  }, [setMode, setThemeName]);

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ShopThemeProvider>
      <ThemeContextBridge>{children}</ThemeContextBridge>
    </ShopThemeProvider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider"); // i18n-exempt -- developer guidance for incorrect hook usage
  return ctx;
}
