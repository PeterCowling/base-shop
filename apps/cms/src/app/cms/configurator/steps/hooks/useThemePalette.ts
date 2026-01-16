"use client";

import { useCallback, useEffect, useState } from "react";
import type { TokenMap } from "@acme/ui/hooks/useTokenEditor";
import { useConfigurator } from "../../ConfiguratorContext";
import { STORAGE_KEY } from "../../hooks/useConfiguratorPersistence";

const colorPalettes: Array<{ name: string; colors: Record<string, string> }> = [
  {
    name: "Base",
    colors: {
      "--color-bg": "0 0% 100%",
      "--color-fg": "0 0% 10%",
      "--color-primary": "220 90% 56%",
      "--color-primary-fg": "0 0% 100%",
      "--color-accent": "260 83% 67%",
      "--color-muted": "0 0% 88%",
    },
  },
  {
    name: "Dark",
    colors: {
      "--color-bg": "0 0% 4%",
      "--color-fg": "0 0% 93%",
      "--color-primary": "220 90% 66%",
      "--color-primary-fg": "0 0% 100%",
      "--color-accent": "260 83% 67%",
      "--color-muted": "0 0% 60%",
    },
  },
  {
    name: "Forest",
    colors: {
      "--color-bg": "0 0% 100%",
      "--color-fg": "0 0% 10%",
      "--color-primary": "160 80% 40%",
      "--color-primary-fg": "0 0% 100%",
      "--color-accent": "200 90% 45%",
      "--color-muted": "0 0% 88%",
    },
  },
];

export function useThemePalette() {
  const { themeDefaults, themeOverrides, setThemeOverrides } = useConfigurator();
  const [palette, setPalette] = useState(colorPalettes[0].name);

  const applyPalette = useCallback(
    (name: string) => {
      const cp = colorPalettes.find((c) => c.name === name);
      if (!cp) return;
      setThemeOverrides((prev) => {
        const next = { ...prev };
        Object.entries(cp.colors).forEach(([k, v]) => {
          if (themeDefaults[k] !== v) {
            next[k] = v;
          } else {
            delete next[k];
          }
        });
        return next;
      });
    },
    [themeDefaults, setThemeOverrides]
  );

  const handleTokenChange = useCallback(
    (tokens: TokenMap) => {
      setThemeOverrides(
        Object.fromEntries(
          Object.entries(tokens).filter(([k, v]) => themeDefaults[k] !== v)
        ) as Record<string, string>
      );
    },
    [setThemeOverrides, themeDefaults]
  );

  const handleReset = useCallback(() => {
    setPalette(colorPalettes[0].name);
    setThemeOverrides({});
    if (typeof window !== "undefined") {
      try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (json) {
          const data = JSON.parse(json);
          data.themeOverrides = {};
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } catch {
        /* ignore */
      }
    }
  }, [setThemeOverrides]);

  useEffect(() => {
    applyPalette(palette);
  }, [palette, applyPalette]);

  return {
    colorPalettes,
    palette,
    setPalette,
    themeOverrides,
    themeDefaults,
    handleTokenChange,
    handleReset,
  };
}
