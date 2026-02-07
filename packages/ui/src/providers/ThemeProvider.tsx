"use client";

import React, { createContext, useMemo } from "react";

import { useShopTheme } from "@acme/platform-core/contexts/ShopThemeContext";
import { ThemeProvider as PlatformThemeProvider } from "@acme/platform-core/contexts/ThemeContext";
import { useThemeMode } from "@acme/platform-core/contexts/ThemeModeContext";
import type { ThemeName } from "@acme/platform-core/contexts/themeStorage";

import { type Theme } from "../types/theme";

export interface ThemeContextValue {
  /** Selected theme mode (light/dark/system). */
  theme: Theme;
  setTheme: (next: Theme) => void;
  /** Theme mode (alias of `theme` for clarity). */
  mode: Theme;
  setMode: (next: Theme) => void;
  /** Resolved mode after system preference. */
  resolvedMode: "light" | "dark";
  isDark: boolean;
  /** Selected brand theme name (base/brand/tenant). */
  themeName: ThemeName;
  setThemeName: (next: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function ThemeContextBridge({ children }: { children: React.ReactNode }) {
  const { mode, setMode, isDark, resolvedMode } = useThemeMode();
  const { themeName, setThemeName } = useShopTheme();

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: mode,
      setTheme: setMode,
      mode,
      setMode,
      resolvedMode,
      isDark,
      themeName,
      setThemeName,
    }),
    [mode, setMode, resolvedMode, isDark, themeName, setThemeName]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <PlatformThemeProvider>
      <ThemeContextBridge>{children}</ThemeContextBridge>
    </PlatformThemeProvider>
  );
};
