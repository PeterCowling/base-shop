"use client";

import { useTheme } from "@platform-core/src/contexts/ThemeContext";

const themes = ["base", "dark", "system"] as const;
const labels: Record<(typeof themes)[number], string> = {
  base: "Light",
  dark: "Dark",
  system: "System",
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme() as unknown as {
    theme: string;
    setTheme: (t: string) => void;
  };

  const currentIndex = themes.indexOf(theme as any);
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
