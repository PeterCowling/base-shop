"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "base" | "dark" | "brandx";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const LS_KEY = "PREFERRED_THEME";

function readInitial(): Theme {
  if (typeof window === "undefined") return "base";
  try {
    const stored = localStorage.getItem(LS_KEY) as Theme | null;
    if (stored === "base" || stored === "dark" || stored === "brandx") return stored;
  } catch {}
  return "base";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, theme);
    }

    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-brandx");
    if (theme === "dark") root.classList.add("theme-dark");
    if (theme === "brandx") root.classList.add("theme-brandx");
  }, [theme]);

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
