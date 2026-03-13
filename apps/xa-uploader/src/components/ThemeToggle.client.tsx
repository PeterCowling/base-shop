"use client";

import * as React from "react";

import { useUploaderI18n } from "../lib/uploaderI18n.client";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem("xa-uploader-theme");
    if (stored === "light") return "light";
  } catch {
    /* noop */
  }
  return "dark";
}

export function ThemeToggle({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const { t } = useUploaderI18n();
  const [theme, setTheme] = React.useState<Theme>(getInitialTheme);

  React.useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- XAUP-0001 apply DOM attribute on mount only; toggle callback handles subsequent updates
  }, []);

  const toggle = React.useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      document.documentElement.classList.toggle("theme-dark", next === "dark");
      try {
        localStorage.setItem("xa-uploader-theme", next);
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const isDark = variant === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? t("themeDarkLabel") : t("themeLightLabel")}
      className={`rounded-md border px-3 py-2 text-2xs uppercase tracking-label-lg transition ${
        isDark
          ? "border-gate-header-border text-gate-header-muted hover:text-gate-header-fg"
          : "border-gate-border text-gate-muted hover:text-gate-ink"
      }`}
    >
      {theme === "light" ? t("themeDarkLabel") : t("themeLightLabel")}
    </button>
  );
}
