"use client";

import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme, Theme } from "@acme/platform-core/contexts/ThemeContext";
import type { ComponentType, KeyboardEvent } from "react";

const themes: Theme[] = ["base", "dark", "system"];

const labels: Record<Theme, string> = {
  base: "Light",
  dark: "Dark",
  system: "System",
  brandx: "BrandX", // unused but satisfy type
};

const icons: Record<Theme, ComponentType> = {
  base: SunIcon,
  dark: MoonIcon,
  system: DesktopIcon,
  brandx: SunIcon,
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const current = theme as Theme;
  const next = themes[(themes.indexOf(current) + 1) % themes.length];
  const Icon = icons[current];

  const toggleTheme = () => {
    setTheme(next);
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
        className="p-2"
      >
        <Icon />
      </button>
      <span aria-live="polite" className="sr-only">
        {labels[current as keyof typeof labels]} theme selected
      </span>
    </div>
  );
}

