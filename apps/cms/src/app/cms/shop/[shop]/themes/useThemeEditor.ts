// apps/cms/src/app/cms/shop/[shop]/themes/useThemeEditor.ts
"use client";
import { useMemo, useRef,useState } from "react";

import { useTranslations } from "@acme/i18n";

import { tokenGroups } from "./tokenGroups";
import { useBrandIntensity } from "./useBrandIntensity";
import { useThemePresetManager } from "./useThemePresetManager";
import { useThemeTokenSync } from "./useThemeTokenSync";

interface Options {
  shop: string;
  themes: string[];
  tokensByTheme: Record<string, Record<string, string>>;
  initialTheme: string;
  initialOverrides: Record<string, string>;
  presets: string[];
}

export function useThemeEditor({
  shop,
  themes,
  tokensByTheme,
  initialTheme,
  initialOverrides,
  presets,
}: Options) {
  const {
    theme,
    overrides,
    setOverrides,
    availableThemes,
    tokensByThemeState,
    presetThemes,
    presetName,
    setPresetName,
    handleSavePreset,
    handleDeletePreset,
    handleThemeChange,
  } = useThemePresetManager({
    shop,
    themes,
    tokensByTheme,
    initialTheme,
    initialOverrides,
    presets,
  });

  const { intensity: brandIntensity, setIntensity: setBrandIntensity } = useBrandIntensity();

  const {
    previewTokens,
    mergedTokens,
    handleOverrideChange,
    handleReset,
    handleGroupReset,
    handleResetAll,
  } = useThemeTokenSync({
    shop,
    theme,
    overrides,
    tokensByThemeState,
    setOverrides,
    brandIntensity,
  });

  const [contrastWarnings, setContrastWarnings] = useState<Record<string, string>>({});
  const overrideRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const textTokenKeys = useMemo(
    () =>
      Object.keys(tokensByThemeState[theme]).filter((k) =>
        /text|foreground/i.test(k),
      ),
    [theme, tokensByThemeState],
  );

  const bgTokenKeys = useMemo(
    () =>
      Object.keys(tokensByThemeState[theme]).filter((k) =>
        /bg|background/i.test(k),
      ),
    [theme, tokensByThemeState],
  );

  const t = useTranslations();

  const groupedTokens = useMemo(() => {
    const tokens = tokensByThemeState[theme];
    const groups: Record<string, [string, string][]> = {};
    const used = new Set<string>();
    Object.entries(tokenGroups).forEach(([groupId, keys]) => {
      const arr: [string, string][] = [];
      keys.forEach((k) => {
        if (k in tokens) {
          arr.push([k, tokens[k]]);
          used.add(k);
        }
      });
      if (arr.length) {
        const label = String(t(`cms.themes.tokenGroups.${groupId}`));
        groups[label] = arr;
      }
    });
    const others: [string, string][] = [];
    Object.entries(tokens).forEach(([k, v]) => {
      if (!used.has(k)) others.push([k, v]);
    });
    if (others.length) {
      const otherLabel = String(t("cms.themes.tokenGroups.other"));
      groups[otherLabel] = others;
    }
    return groups;
  }, [theme, tokensByThemeState, t]);

  const handleWarningChange = (token: string, warning: string | null) => {
    setContrastWarnings((prev) => {
      const next = { ...prev };
      if (warning) next[token] = warning;
      else delete next[token];
      return next;
    });
  };

  const handleTokenSelect = (token: string) => {
    const input = overrideRefs.current[token] as HTMLInputElement | null;
    if (input) {
      input.scrollIntoView?.({ behavior: "smooth", block: "center" });
      input.focus();
      input.showPicker?.();
      if (!input.showPicker) {
        input.click();
      }
    }
  };

  return {
    theme,
    availableThemes,
    tokensByThemeState,
    presetThemes,
    brandIntensity,
    setBrandIntensity,
    presetName,
    setPresetName,
    handleSavePreset,
    handleDeletePreset,
    overrides,
    previewTokens,
    handleOverrideChange,
    handleReset,
    handleGroupReset,
    overrideRefs,
    mergedTokens,
    groupedTokens,
    textTokenKeys,
    bgTokenKeys,
    handleWarningChange,
    contrastWarnings,
    handleTokenSelect,
    handleThemeChange,
    handleResetAll,
  };
}
