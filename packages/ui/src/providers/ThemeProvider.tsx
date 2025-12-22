// src/providers/ThemeProvider.tsx
// -----------------------------------------------------------------
import { Theme } from "@/types/theme";
import React, { createContext, useCallback, useEffect, useMemo, useReducer } from "react";

/* ———————————————————————————————————————————————
     ▪ STATE / ACTION TYPES
  ——————————————————————————————————————————————— */
interface State {
  theme: Theme; // user-picked theme ('light' | 'dark')
}

type Action = { type: "SET_THEME"; theme: Theme } | { type: "INIT"; theme: Theme };

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

const readStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage?.getItem(THEME_KEY) as Theme | null;
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
      return { theme: action.theme };
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
    theme: "light",
  });

  /* 2 ▪ One-shot browser initialisation */
  useEffect(() => {
    const stored = readStoredTheme();
    const inferred = prefersDarkScheme() ? "dark" : "light";
    dispatch({
      type: "INIT",
      theme: stored ?? inferred,
    });
  }, []);

  /* 4 ▪ Persist user-chosen theme */
  useEffect(() => {
    writeStoredTheme(state.theme);
  }, [state.theme]);

  /* 5 ▪ Apply / remove `.dark` on <html> */
  useEffect(() => {
    const root = document.documentElement;
    const dark = state.theme === "dark";

    root.classList.toggle("dark", dark);
  }, [state.theme]);

  /* 6 ▪ Helpers */
  const setTheme = useCallback((next: Theme) => {
    dispatch({ type: "SET_THEME", theme: next });
  }, []);

  const ctx = useMemo<ThemeContextValue>(() => {
    const isDark = state.theme === "dark";
    return { theme: state.theme, setTheme, isDark };
  }, [state.theme, setTheme]);

  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>;
};
