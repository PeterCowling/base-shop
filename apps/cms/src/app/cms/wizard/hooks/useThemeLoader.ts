// apps/cms/src/app/cms/wizard/hooks/useThemeLoader.ts
"use client";

import { useEffect } from "react";
import { baseTokens, loadThemeTokens } from "../tokenUtils";
import { useWizard } from "../WizardContext";

/**
 * Loads theme tokens whenever the selected theme changes and returns the
 * computed CSS style object for the current tokens.
 */
export function useThemeLoader(): React.CSSProperties {
  const { state, setState } = useWizard();
  const { theme, themeVars } = state;

  /* On initial mount ensure base tokens exist */
  useEffect(() => {
    if (!themeVars || Object.keys(themeVars).length === 0) {
      setState((prev) => ({ ...prev, themeVars: baseTokens }));
    }
  }, []);

  /* Load tokens for selected theme */
  useEffect(() => {
    loadThemeTokens(theme).then((tv) => {
      setState((prev) => ({ ...prev, themeVars: tv }));
    });
  }, [theme, setState]);

  return Object.fromEntries(
    Object.entries(themeVars ?? {}).map(([k, v]) => [k, v])
  ) as React.CSSProperties;
}

