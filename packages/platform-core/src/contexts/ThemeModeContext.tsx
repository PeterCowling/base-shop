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

import {
  LEGACY_THEME_KEY,
  normalizeLegacyTheme,
  normalizeThemeMode,
  THEME_MODE_KEY,
  type ThemeMode,
} from "./themeStorage";

interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: "light" | "dark";
  isDark: boolean;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

export function getSystemMode(): "light" | "dark" {
  try {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches // i18n-exempt -- media query string, not user-facing copy
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function readStoredMode(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_MODE_KEY);
    const parsed = normalizeThemeMode(raw);
    if (parsed) return parsed;
    const legacy = normalizeLegacyTheme(window.localStorage.getItem(LEGACY_THEME_KEY));
    return legacy?.mode ?? null;
  } catch {
    return null;
  }
}

function writeStoredMode(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredMode() ?? "system");
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return getSystemMode() === "dark";
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    const resolved = mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;
    root.classList.toggle("theme-dark", resolved === "dark");
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved === "dark" ? "dark" : "light";
  }, [mode, systemPrefersDark]);

  useEffect(() => {
    writeStoredMode(mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    let mq: MediaQueryList | null = null;
    const update = (e: MediaQueryList | MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    try {
      mq = window.matchMedia("(prefers-color-scheme: dark)"); // i18n-exempt -- media query string, not user-facing copy
      update(mq);
      mq.addEventListener("change", update);
      return () => mq?.removeEventListener("change", update);
    } catch {
      setSystemPrefersDark(false);
    }
    return undefined;
  }, [mode]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === THEME_MODE_KEY) {
        const next = normalizeThemeMode(e.newValue ?? null);
        if (next) setMode(next);
      }
      if (e.key === LEGACY_THEME_KEY) {
        const legacy = normalizeLegacyTheme(e.newValue ?? null);
        if (legacy?.mode) setMode(legacy.mode);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value = useMemo<ThemeModeContextValue>(() => {
    const resolvedMode = mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;
    return {
      mode,
      setMode,
      resolvedMode,
      isDark: resolvedMode === "dark",
    };
  }, [mode, systemPrefersDark]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be inside ThemeModeProvider"); // i18n-exempt -- developer guidance
  return ctx;
}
