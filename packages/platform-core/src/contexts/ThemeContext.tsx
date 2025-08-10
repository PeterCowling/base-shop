"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

export type Theme = "base" | "dark" | "brandx" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function getSavedTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("theme") as Theme | null;
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "base";
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
    if (applied === "dark") root.classList.add("theme-dark");
    if (applied === "brandx") root.classList.add("theme-brandx");
    window.localStorage.setItem("theme", theme);
  }, [theme, systemTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = (e: MediaQueryList | MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "base");
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
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
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
