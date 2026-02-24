import React from "react";

import { ReceptionButton as Button } from "@acme/ui/operations";

import { useReceptionTheme } from "../../providers/ReceptionThemeProvider";

/**
 * A simple button that toggles the application's dark mode state.
 */
export default function DarkModeToggle(): JSX.Element {
  const { dark, toggleDark } = useReceptionTheme();

  return (
    <Button
      type="button"
      onClick={toggleDark}
      aria-label="Toggle dark mode"
      aria-pressed={dark}
      className="px-3 py-2 text-sm font-semibold text-muted-foreground dark:text-accent-hospitality"
    >
      {dark ? "Light" : "Dark"} Mode
    </Button>
  );
}
