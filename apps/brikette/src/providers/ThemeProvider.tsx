// src/providers/ThemeProvider.tsx
// -----------------------------------------------------------------
import React, { createContext, type ReactNode, useCallback, useMemo } from "react";

import { ThemeModeProvider, useThemeMode } from "@acme/platform-core/contexts/ThemeModeContext";
import { ThemeProvider as UiThemeProvider } from "@acme/ui/providers/ThemeProvider";

export type Theme = "light" | "dark" | "system";

export interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function ThemeContextBridge({ children }: { children: ReactNode }) {
  const { mode, setMode, isDark } = useThemeMode();
  const setTheme = useCallback((next: Theme) => setMode(next), [setMode]);
  const value = useMemo<ThemeContextValue>(() => ({
    theme: mode,
    isDark,
    setTheme,
  }), [mode, isDark, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeModeProvider>
      <UiThemeProvider>
        <ThemeContextBridge>{children}</ThemeContextBridge>
      </UiThemeProvider>
    </ThemeModeProvider>
  );
}
