// src/hooks/useTheme.ts
// -----------------------------------------------------------------
import { ThemeContext, ThemeContextValue } from "@/providers/ThemeProvider";
import { useContext } from "react";

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
