// src/providers/ThemeProvider.tsx
// -----------------------------------------------------------------
import React, { createContext, useCallback, useEffect, useMemo, useReducer } from "react";

import { type Theme } from "../types/theme";

/* ———————————————————————————————————————————————
     ▪ STATE / ACTION TYPES
  ——————————————————————————————————————————————— */
interface State {
  theme: Theme; // user-picked theme ('light' | 'dark' | 'system')
  systemPrefersDark: boolean;
}

type Action =
  | { type: "SET_THEME"; theme: Theme }
  | { type: "INIT"; theme: Theme; systemPrefersDark: boolean }
  | { type: "SET_SYSTEM_PREFERS_DARK"; systemPrefersDark: boolean };

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (next: Theme) => void;
  isDark: boolean; // effective mode after resolution
}

/* ———————————————————————————————————————————————
     ▪ CONTEXT
  ——————————————————————————————————————————————— */
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = "theme";

const normalizeStoredTheme = (raw: string | null): Theme | null => {
  if (!raw) return null;
  if (raw === "base") return "light"; // legacy value used in some apps
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return null;
};

const readStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return normalizeStoredTheme(window.localStorage?.getItem(THEME_KEY) ?? null);
  } catch {
    return null;
  }
};

const writeStoredTheme = (theme: Theme): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.setItem(THEME_KEY, theme);
  } catch {
    /* storage may be unavailable (privacy mode, SSR) */
  }
};

const prefersDarkScheme = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const { matchMedia } = window;
  if (typeof matchMedia !== "function") {
    return false;
  }

  try {
    // i18n-exempt -- UI-1000 [ttl=2026-12-31] CSS media query string (non-user-facing).
    return matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
};

/* ———————————————————————————————————————————————
     ▪ REDUCER  (init handled separately)
  ——————————————————————————————————————————————— */
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "INIT":
      return { theme: action.theme, systemPrefersDark: action.systemPrefersDark };
    case "SET_SYSTEM_PREFERS_DARK":
      return { ...state, systemPrefersDark: action.systemPrefersDark };
    default:
      return state;
  }
};

/* ———————————————————————————————————————————————
     ▪ PROVIDER
  ——————————————————————————————————————————————— */
export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  /* 1 ▪ Start in a deterministic SSR-safe state */
  const [state, dispatch] = useReducer(reducer, {
    theme: "system",
    systemPrefersDark: false,
  });

  /* 2 ▪ One-shot browser initialisation */
  useEffect(() => {
    const stored = readStoredTheme();
    dispatch({
      type: "INIT",
      theme: stored ?? "system",
      systemPrefersDark: prefersDarkScheme(),
    });
  }, []);

  /* 3 ▪ Track OS scheme when in system mode */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state.theme !== "system") return;
    let mq: MediaQueryList | null = null;
    const update = (e: MediaQueryList | MediaQueryListEvent) => {
      dispatch({
        type: "SET_SYSTEM_PREFERS_DARK",
        systemPrefersDark: e.matches,
      });
    };
    try {
      mq = window.matchMedia("(prefers-color-scheme: dark)"); // i18n-exempt -- UI-1000 [ttl=2026-12-31] CSS media query string (non-user-facing).
      update(mq);
      mq.addEventListener("change", update);
      return () => mq?.removeEventListener("change", update);
    } catch {
      dispatch({ type: "SET_SYSTEM_PREFERS_DARK", systemPrefersDark: false });
    }
  }, [state.theme]);

  /* 4 ▪ Persist user-chosen theme */
  useEffect(() => {
    writeStoredTheme(state.theme);
  }, [state.theme]);

  /* 5 ▪ Apply / remove theme class on <html> */
  useEffect(() => {
    const root = document.documentElement;
    const dark = state.theme === "dark" || (state.theme === "system" && state.systemPrefersDark);

    // Canonical contract: `.theme-dark`. Keep `.dark` in sync for backwards compatibility.
    root.classList.toggle("theme-dark", dark);
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  }, [state.theme, state.systemPrefersDark]);

  /* 6 ▪ Helpers */
  const setTheme = useCallback((next: Theme) => {
    if (process.env.NODE_ENV === "development") {
      console.info("[ThemeProvider] setTheme", next);
    }
    dispatch({ type: "SET_THEME", theme: next });
  }, []);

  const ctx = useMemo<ThemeContextValue>(() => {
    const isDark = state.theme === "dark" || (state.theme === "system" && state.systemPrefersDark);
    return { theme: state.theme, setTheme, isDark };
  }, [state.theme, state.systemPrefersDark, setTheme]);

  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>;
};
