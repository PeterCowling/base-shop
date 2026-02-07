import React from "react";

import { useTheme } from "../ThemeContext";

// React 19 requires this flag for `act` to suppress environment warnings
// when not using a test renderer.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

export function ThemeDisplay() {
  const { theme } = useTheme();
  return <span data-cy="theme">{theme}</span>;
}

