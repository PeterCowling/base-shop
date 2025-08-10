"use client";

import { useTheme, type Theme } from "@platform-core/src/contexts/ThemeContext";
import type { ChangeEvent } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setTheme(event.target.value as Theme);
  };

  return (
    <select
      aria-label="Theme"
      className="hover:underline"
      value={theme}
      onChange={handleChange}
    >
      <option value="base">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
