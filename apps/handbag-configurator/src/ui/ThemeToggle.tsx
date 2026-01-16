"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@acme/i18n";

type Theme = "base" | "dark";

const THEME_KEY = "theme";

const readStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "base";
  try {
    return window.localStorage?.getItem(THEME_KEY) === "dark" ? "dark" : "base";
  } catch {
    return "base";
  }
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  const dark = theme === "dark";
  root.classList.toggle("theme-dark", dark);
  try {
    root.style.colorScheme = dark ? "dark" : "light";
  } catch {
    // ignore unsupported browsers
  }
};

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const t = useTranslations();
  const [theme, setTheme] = useState<Theme>("base");

  useEffect(() => {
    const initial = readStoredTheme();
    setTheme(initial);
    applyTheme(initial);
    try {
      if (!window.localStorage?.getItem(THEME_KEY)) {
        window.localStorage?.setItem(THEME_KEY, initial);
      }
    } catch {
      // ignore storage failures
    }
  }, []);

  const isDark = theme === "dark";

  const toggleTheme = () => {
    const next = isDark ? "base" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage?.setItem(THEME_KEY, next);
    } catch {
      // ignore storage failures
    }
  };

  const toggleLabel = isDark
    ? t("handbag.theme.switchToLight")
    : t("handbag.theme.switchToDark");

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={isDark}
        aria-label={toggleLabel}
        title={toggleLabel}
        className={`inline-flex h-8 w-14 items-center rounded-full border border-border-2 bg-surface-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className ?? ""}`}
      >
        <span className="sr-only">{t("handbag.theme.toggle")}</span>
        <span className="pointer-events-none absolute start-2 text-xs uppercase tracking-widest text-muted-foreground">
          L
        </span>
        <span className="pointer-events-none absolute end-2 text-xs uppercase tracking-widest text-muted-foreground">
          D
        </span>
        <span
          className={`absolute start-1 top-1 h-6 w-6 rounded-full bg-foreground shadow transition-transform duration-200 ${
            isDark ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </span>
  );
}
