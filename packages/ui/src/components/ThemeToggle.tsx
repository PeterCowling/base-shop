"use client";

import { useTheme } from "@platform-core/src/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "base" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="hover:underline"
      aria-label="Toggle theme"
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
