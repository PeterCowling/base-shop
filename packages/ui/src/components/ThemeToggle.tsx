"use client";

import { useTheme, Theme } from "@platform-core/src/contexts/ThemeContext";
import type { ChangeEvent } from "react";

const themes: Theme[] = ["base", "dark", "system"];
const labels: Record<Theme, string> = {
  base: "Light",
  dark: "Dark",
  system: "System",
  brandx: "BrandX", // unused but satisfy type
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.value as Theme);
  };

  return (
    <div role="radiogroup" aria-label="Theme">
      {themes.map((t) => (
        <div key={t} className="flex items-center gap-2">
          <input
            type="radio"
            id={`theme-${t}`}
            name="theme"
            value={t}
            checked={theme === t}
            onChange={handleChange}
            aria-checked={theme === t}
          />
          <label htmlFor={`theme-${t}`}>{labels[t]}</label>
        </div>
      ))}
      <span aria-live="polite" className="sr-only">
        {labels[theme as keyof typeof labels]} theme selected
      </span>
    </div>
  );
}
