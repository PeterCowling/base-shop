import React from "react";

import { useDarkMode } from "../../context/DarkModeContext";

/**
 * A simple button that toggles the application's dark mode state.
 */
export default function DarkModeToggle(): JSX.Element {
  const { dark, toggleDark } = useDarkMode();

  return (
    <button
      type="button"
      onClick={toggleDark}
      aria-label="Toggle dark mode"
      aria-pressed={dark}
      className="px-3 py-2 text-sm font-semibold text-gray-600 dark:text-darkAccentGreen"
    >
      {dark ? "Light" : "Dark"} Mode
    </button>
  );
}
