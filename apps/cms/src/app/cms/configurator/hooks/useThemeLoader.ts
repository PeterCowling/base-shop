// apps/cms/src/app/cms/configurator/hooks/useThemeLoader.ts
"use client";

import { useEffect } from "react";
import { baseTokens, loadThemeTokens } from "../../wizard/tokenUtils";
import type { TokenMap } from "../../wizard/tokenUtils";
import { useConfigurator } from "../ConfiguratorContext";
import type { ConfiguratorState } from "../../wizard/schema";

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
      setState((prev: ConfiguratorState) => ({
        ...prev,
        themeDefaults: baseTokens,
      }));
    }
  }, [themeDefaults, setState]);

  /* Load tokens for selected theme (avoid redundant updates) */
  useEffect(() => {
    let cancelled = false;
    loadThemeTokens(theme).then((tv) => {
      if (cancelled) return;
      setState((prev: ConfiguratorState) => {
        // If nothing actually changed, skip the state update to avoid re-render churn
        const prevTokens = (prev.themeDefaults ?? {}) as Partial<TokenMap>;
        const prevKeys = Object.keys(prevTokens);
        const nextKeys = Object.keys(tv) as Array<keyof TokenMap>;
        if (prevKeys.length === nextKeys.length) {
          let same = true;
          for (let i = 0; i < nextKeys.length; i++) {
            const k = nextKeys[i]! as keyof TokenMap;
            if (prevTokens[k] !== tv[k]) { same = false; break; }
          }
          if (same) return prev;
        }
        return { ...prev, themeDefaults: tv } as ConfiguratorState;
      });
    });
    return () => { cancelled = true; };
  }, [theme, setState]);

  return { ...themeDefaults, ...themeOverrides } as React.CSSProperties;
}
