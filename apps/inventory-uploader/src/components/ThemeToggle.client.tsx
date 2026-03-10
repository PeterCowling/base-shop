"use client";

import * as React from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "inventory-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light") return "light";
  } catch {
    /* noop */
  }
  return "dark";
}

export function ThemeToggle({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const [theme, setTheme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    document.documentElement.classList.toggle("theme-dark", initial === "dark");
  }, []);

  const toggle = React.useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      document.documentElement.classList.toggle("theme-dark", next === "dark");
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const isDark = variant === "dark";
  const label = theme === "light" ? "Dark" : "Light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${label.toLowerCase()} theme`}
      className={`rounded-md border px-3 py-2 text-2xs uppercase tracking-label-lg transition ${
        isDark
          ? "border-gate-header-border text-gate-header-muted hover:text-gate-header-fg"
          : "border-gate-border text-gate-muted hover:text-gate-ink"
      }`}
    >
      {label}
    </button>
  );
}
