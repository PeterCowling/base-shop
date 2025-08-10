"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useLayoutEffect,
  useState,
} from "react";

export type Theme = "base" | "dark" | "brandx" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): Exclude<Theme, "brandx" | "system"> {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "base";
  }
  return "base";
}

function getInitialTheme(): Theme {
  if (typeof window !== "undefined") {
    const storedTheme = window.localStorage.getItem("theme") as Theme | null;
    if (storedTheme) return storedTheme;
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState<Exclude<Theme, "system">>(
    getSystemTheme
  );

  useLayoutEffect(() => {
    const mediaQuery =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "base");
    };
    if (theme === "system" && mediaQuery) {
      setSystemTheme(mediaQuery.matches ? "dark" : "base");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-brandx");
    const applied = theme === "system" ? systemTheme : theme;
    if (applied === "dark") root.classList.add("theme-dark");
    if (applied === "brandx") root.classList.add("theme-brandx");
    window.localStorage.setItem("theme", theme);
  }, [theme, systemTheme]);

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
