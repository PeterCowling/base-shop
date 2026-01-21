/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
// src/hooks/useTheme.ts
// -----------------------------------------------------------------
import { useContext } from "react";

import { ThemeContext, type ThemeContextValue } from "@/providers/ThemeProvider";

/**
 * Access the current theme and setter.
 * Throws at runtime (and narrows the type) when no provider is present.
 */
export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx; // non-nullable here ✔
};
