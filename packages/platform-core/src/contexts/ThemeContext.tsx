"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "base" | "dark" | "brandx" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function getSavedTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("theme") as Theme | null;
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

function getInitialTheme(): Theme {
  const stored = getSavedTheme();
  if (stored) return stored;
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme());

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-brandx");

    const applied = theme === "system" ? systemTheme : theme;
    root.style.colorScheme = applied === "dark" ? "dark" : "light";
    if (applied === "dark") root.classList.add("theme-dark");
    if (applied === "brandx") root.classList.add("theme-brandx");
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      /* no-op */
    }
  }, [theme, systemTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    let mq: MediaQueryList | null = null;
    const update = (e: MediaQueryList | MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "base");
    try {
      mq = window.matchMedia("(prefers-color-scheme: dark)"); // i18n-exempt -- media query string, not user-facing copy
      update(mq);
      mq.addEventListener("change", update);
      return () => mq?.removeEventListener("change", update);
    } catch {
      setSystemTheme("base");
    }
  }, [theme]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        setTheme(e.newValue as Theme);
      }
    };
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("storage", handler);
    };
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider"); // i18n-exempt -- developer guidance for incorrect hook usage
  return ctx;
}
