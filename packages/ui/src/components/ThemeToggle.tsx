"use client";

import { useTheme } from "@platform-core/src/contexts/ThemeContext";
import { Switch } from "./atoms/Switch";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Switch
      aria-label="Toggle dark mode"
      checked={theme === "dark"}
      onChange={(e) => setTheme(e.target.checked ? "dark" : "base")}
    />
  );
}
