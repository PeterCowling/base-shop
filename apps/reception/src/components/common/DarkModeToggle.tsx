import React from "react";

import { Button } from "@acme/design-system/atoms";

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
      color="default"
      tone="ghost"
      size="sm"
    >
      {dark ? "Light" : "Dark"} Mode
    </Button>
  );
}
