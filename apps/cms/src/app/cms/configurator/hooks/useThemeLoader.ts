// apps/cms/src/app/cms/configurator/hooks/useThemeLoader.ts
"use client";

import { useEffect } from "react";
import { baseTokens, loadThemeTokens } from "../../wizard/tokenUtils";
import { useConfigurator } from "../ConfiguratorContext";

/**
 * Loads theme tokens whenever the selected theme changes and returns the
 * computed CSS style object for the current tokens.
 */
export function useThemeLoader(): React.CSSProperties {
  const { state, setState } = useConfigurator();
  const { theme, themeDefaults, themeOverrides } = state;

  /* On initial mount ensure base tokens exist */
  useEffect(() => {
    if (!themeDefaults || Object.keys(themeDefaults).length === 0) {
      setState((prev) => ({ ...prev, themeDefaults: baseTokens }));
    }
  }, []);

  /* Load tokens for selected theme */
  useEffect(() => {
    loadThemeTokens(theme).then((tv) => {
      setState((prev) => ({ ...prev, themeDefaults: tv }));
    });
  }, [theme, setState]);

  return { ...themeDefaults, ...themeOverrides } as React.CSSProperties;
}

