"use client";

import { useTheme, Theme } from "@platform-core/src/contexts/ThemeContext";

const themes: Theme[] = ["base", "dark", "system"];
const labels: Record<Theme, string> = {
  base: "Light",
  dark: "Dark",
  system: "System",
  brandx: "BrandX", // unused but satisfy type
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const currentIndex = themes.indexOf(theme as Theme);
  const nextTheme = themes[(currentIndex + 1) % themes.length];
  const ariaPressed: boolean | "mixed" =
    theme === "dark" ? true : theme === "base" ? false : "mixed";

  const toggleTheme = () => {
    setTheme(nextTheme);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggleTheme}
        className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label="Toggle theme"
        aria-pressed={ariaPressed}
      >
        {labels[nextTheme]}
      </button>
      <span aria-live="polite" className="sr-only">
        {labels[theme as keyof typeof labels]} theme selected
      </span>
    </>
  );
}
