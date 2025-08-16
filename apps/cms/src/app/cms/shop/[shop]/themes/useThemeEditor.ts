// apps/cms/src/app/cms/shop/[shop]/themes/useThemeEditor.ts
"use client";
import { useState, useMemo, useRef, useEffect, ChangeEvent } from "react";
import { patchShopTheme } from "../../../wizard/services/patchTheme";
import { tokenGroups } from "./tokenGroups";
import { useThemePresets } from "./useThemePresets";
import { savePreviewTokens } from "../../../wizard/previewTokens";

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
  const [theme, setTheme] = useState(initialTheme);
  const [overrides, setOverrides] =
    useState<Record<string, string>>(initialOverrides);
  const [, setThemeDefaults] = useState<Record<string, string>>(
    tokensByTheme[initialTheme]
  );
  const {
    availableThemes,
    tokensByThemeState,
    presetThemes,
    presetName,
    setPresetName,
    handleSavePreset,
    handleDeletePreset,
  } = useThemePresets({
    shop,
    initialThemes: themes,
    initialTokensByTheme: tokensByTheme,
    presets,
    theme,
    overrides,
    setTheme,
    setOverrides,
    setThemeDefaults,
  });
  const [contrastWarnings, setContrastWarnings] = useState<
    Record<string, string>
  >({});
  const overrideRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [previewTokens, setPreviewTokens] = useState<Record<string, string>>({
    ...tokensByThemeState[initialTheme],
    ...initialOverrides,
  });
  const debounceRef = useRef<number | null>(null);
  const saveDebounceRef = useRef<number | null>(null);
  const pendingPatchRef = useRef<{
    overrides: Record<string, string>;
    defaults: Record<string, string>;
  }>({ overrides: {}, defaults: {} });

  const mergedTokens = useMemo(
    () => ({ ...tokensByThemeState[theme], ...overrides }),
    [theme, tokensByThemeState, overrides]
  );

  const textTokenKeys = useMemo(
    () =>
      Object.keys(tokensByThemeState[theme]).filter((k) =>
        /text|foreground/i.test(k)
      ),
    [theme, tokensByThemeState]
  );

  const bgTokenKeys = useMemo(
    () =>
      Object.keys(tokensByThemeState[theme]).filter((k) =>
        /bg|background/i.test(k)
      ),
    [theme, tokensByThemeState]
  );

  const groupedTokens = useMemo(() => {
    const tokens = tokensByThemeState[theme];
    const groups: Record<string, [string, string][]> = {};
    const used = new Set<string>();
    Object.entries(tokenGroups).forEach(([group, keys]) => {
      const arr: [string, string][] = [];
      keys.forEach((k) => {
        if (k in tokens) {
          arr.push([k, tokens[k]]);
          used.add(k);
        }
      });
      if (arr.length) groups[group] = arr;
    });
    const others: [string, string][] = [];
    Object.entries(tokens).forEach(([k, v]) => {
      if (!used.has(k)) others.push([k, v]);
    });
    if (others.length) groups.Other = others;
    return groups;
  }, [theme, tokensByThemeState]);

  const schedulePreviewUpdate = (tokens: Record<string, string>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      setPreviewTokens(tokens);
      savePreviewTokens(tokens);
    }, 100);
  };

  const scheduleSave = (
    overridesPatch: Record<string, string>,
    defaultsPatch: Record<string, string> = {}
  ) => {
    pendingPatchRef.current = {
      overrides: {
        ...pendingPatchRef.current.overrides,
        ...overridesPatch,
      },
      defaults: {
        ...pendingPatchRef.current.defaults,
        ...defaultsPatch,
      },
    };
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = window.setTimeout(async () => {
      const payload = pendingPatchRef.current;
      pendingPatchRef.current = { overrides: {}, defaults: {} };
      try {
        await patchShopTheme(shop, {
          themeOverrides: payload.overrides,
          themeDefaults: payload.defaults,
        });
      } catch (err) {
        console.error(err);
      }
    }, 500);
  };

  // Persist merged tokens and broadcast to preview whenever they change
  useEffect(() => {
    schedulePreviewUpdate(mergedTokens);
  }, [mergedTokens]);

  const handleWarningChange = (token: string, warning: string | null) => {
    setContrastWarnings((prev) => {
      const next = { ...prev };
      if (warning) next[token] = warning;
      else delete next[token];
      return next;
    });
  };

  const handleOverrideChange =
    (key: string, defaultValue: string) => (value: string) => {
      setOverrides((prev) => {
        const next = { ...prev };
        const patch: Record<string, string> = {};
        if (!value || value === defaultValue) {
          delete next[key];
          patch[key] = defaultValue;
        } else {
          next[key] = value;
          patch[key] = value;
        }
        scheduleSave(patch);
        return next;
      });
    };

  const handleReset = (key: string) => () => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      scheduleSave({ [key]: tokensByThemeState[theme][key] });
      return next;
    });
  };

  const handleGroupReset = (keys: string[]) => () => {
    setOverrides((prev) => {
      const next = { ...prev };
      const patch: Record<string, string> = {};
      keys.forEach((k) => {
        delete next[k];
        patch[k] = tokensByThemeState[theme][k];
      });
      scheduleSave(patch);
      return next;
    });
  };

  const handleTokenSelect = (token: string) => {
    const input = overrideRefs.current[token];
    if (input) {
      input.scrollIntoView?.({ behavior: "smooth", block: "center" });
      input.focus();
      (input as any).showPicker?.();
      if (!(input as any).showPicker) {
        input.click();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }, []);

  // Broadcast initial tokens so previews reflect the current theme on mount
  useEffect(() => {
    savePreviewTokens(previewTokens);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleThemeChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    setOverrides({});
    setThemeDefaults(tokensByThemeState[newTheme]);
  };

  const handleResetAll = async () => {
    if (!window.confirm("Are you sure you want to reset all overrides?")) {
      return;
    }
    const patch: Record<string, string> = {};
    Object.keys(overrides).forEach((k) => {
      patch[k] = tokensByThemeState[theme][k];
    });
    setOverrides({});
    scheduleSave(patch);
  };

  return {
    theme,
    availableThemes,
    tokensByThemeState,
    presetThemes,
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
