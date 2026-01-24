"use client";

import { useThemeMode } from "@acme/platform-core/contexts/ThemeModeContext";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, setMode } = useThemeMode();

  const toggleTheme = () => {
    setMode(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex h-8 w-14 items-center rounded-full border border-border-2 bg-surface-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className ?? ""}`}
    >
      <span className="sr-only">Toggle theme</span>
      <span className="pointer-events-none absolute left-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        L
      </span>
      <span className="pointer-events-none absolute right-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        D
      </span>
      <span
        className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-foreground shadow transition-transform duration-200 ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}
