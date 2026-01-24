"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import { ThemeModeProvider, useThemeMode } from "./ThemeModeContext";
import {
  LEGACY_THEME_KEY,
  legacyThemeFrom,
  normalizeLegacyTheme,
  normalizeThemeName,
  THEME_NAME_KEY,
  type ThemeName,
} from "./themeStorage";

interface ShopThemeContextValue {
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
}

const ShopThemeContext = createContext<ShopThemeContextValue | undefined>(undefined);

function readStoredThemeName(): ThemeName | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_NAME_KEY);
    const parsed = normalizeThemeName(raw);
    if (parsed) return parsed;
    const legacy = normalizeLegacyTheme(window.localStorage.getItem(LEGACY_THEME_KEY));
    return legacy?.name ?? null;
  } catch {
    return null;
  }
}

function writeStoredThemeName(name: ThemeName): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_NAME_KEY, name);
  } catch {
    /* ignore */
  }
}

function writeLegacyTheme(theme: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEGACY_THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

function ShopThemeProviderInner({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode();
  const [themeName, setThemeName] = useState<ThemeName>(() => readStoredThemeName() ?? "base");

  useLayoutEffect(() => {
    const root = document.documentElement;
    const prev = root.dataset.theme;
    if (prev && prev !== "base") {
      root.classList.remove(`theme-${prev}`);
    }
    root.dataset.theme = themeName;
    if (themeName !== "base") {
      root.classList.add(`theme-${themeName}`);
    }
  }, [themeName]);

  useEffect(() => {
    writeStoredThemeName(themeName);
  }, [themeName]);

  useEffect(() => {
    const legacy = legacyThemeFrom(mode, themeName);
    writeLegacyTheme(legacy);
  }, [mode, themeName]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === THEME_NAME_KEY) {
        const next = normalizeThemeName(e.newValue ?? null);
        if (next) setThemeName(next);
      }
      if (e.key === LEGACY_THEME_KEY) {
        const legacy = normalizeLegacyTheme(e.newValue ?? null);
        if (legacy?.name) setThemeName(legacy.name);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value = useMemo<ShopThemeContextValue>(() => ({ themeName, setThemeName }), [themeName]);

  return <ShopThemeContext.Provider value={value}>{children}</ShopThemeContext.Provider>;
}

export function ShopThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeModeProvider>
      <ShopThemeProviderInner>{children}</ShopThemeProviderInner>
    </ThemeModeProvider>
  );
}

export function useShopTheme() {
  const ctx = useContext(ShopThemeContext);
  if (!ctx) throw new Error("useShopTheme must be inside ShopThemeProvider"); // i18n-exempt -- developer guidance
  return ctx;
}
