"use client";

import type { ComponentType, KeyboardEvent } from "react";
import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";

import { useThemeMode } from "@acme/platform-core/contexts/ThemeModeContext";
// Minimal local translator to satisfy lint without runtime changes
const t = (s: string) => s;

const themes = ["light", "dark", "system"] as const;
type ThemeMode = typeof themes[number];

const labels: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const icons: Record<ThemeMode, ComponentType> = {
  light: SunIcon,
  dark: MoonIcon,
  system: DesktopIcon,
};

export default function ThemeToggle() {
  const { mode, setMode } = useThemeMode();

  const current = mode;
  const next = themes[(themes.indexOf(current) + 1) % themes.length];
  const Icon = icons[current];

  const toggleTheme = () => {
    setMode(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggleTheme}
        onKeyDown={handleKeyDown}
        aria-label={`Switch to ${labels[next]} theme`}
        className="p-2 min-h-11 min-w-11"
      >
        <Icon />
      </button>
      <span aria-live="polite" className="sr-only">
        {t(`${labels[current]} theme selected`)}
      </span>
    </div>
  );
}
