"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";

import { useTranslations } from "@acme/i18n";

import { savePreviewTokens } from "../../../wizard/previewTokens";
import { patchShopTheme } from "../../../wizard/services/patchTheme";

import type { BrandIntensity } from "./brandIntensity";
import { computeBrandOverlay } from "./brandIntensity";

interface Args {
  shop: string;
  theme: string;
  overrides: Record<string, string>;
  tokensByThemeState: Record<string, Record<string, string>>;
  setOverrides: Dispatch<SetStateAction<Record<string, string>>>;
  brandIntensity?: BrandIntensity;
}

export function useThemeTokenSync({
  shop,
  theme,
  overrides,
  tokensByThemeState,
  setOverrides,
  brandIntensity = "Everyday",
}: Args) {
  const t = useTranslations();
  const [previewTokens, setPreviewTokens] = useState<Record<string, string>>({
    ...tokensByThemeState[theme],
    ...overrides,
  });
  const debounceRef = useRef<number | null>(null);
  const saveDebounceRef = useRef<number | null>(null);
  const pendingPatchRef = useRef<{
    overrides: Record<string, string>;
    defaults: Record<string, string>;
  }>({ overrides: {}, defaults: {} });

  const mergedTokens = useMemo(
    () => ({ ...tokensByThemeState[theme], ...overrides }),
    [theme, tokensByThemeState, overrides],
  );

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
    defaultsPatch: Record<string, string> = {},
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

  useEffect(() => {
    const brandOverlay = computeBrandOverlay(brandIntensity);
    // Apply brand overlay to preview only (do not mutate overrides)
    const preview = { ...mergedTokens, ...brandOverlay } as Record<string, string>;
    schedulePreviewUpdate(preview);
  }, [mergedTokens, brandIntensity]);

  // If the theme changes, cancel any pending patch so old overrides don't
  // persist into the newly-selected theme.
  useEffect(() => {
    pendingPatchRef.current = { overrides: {}, defaults: {} };
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = null;
    }
  }, [theme]);

  // Broadcast initial tokens so previews reflect the current theme on mount
  useEffect(() => {
    savePreviewTokens(previewTokens);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- CMS-2145: run once on mount to broadcast initial preview tokens
    }, []);

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

  const handleOverrideChange = (
    key: string,
    defaultValue: string,
  ) => (value: string) => {
    setOverrides((prev) => {
      const next = { ...prev } as Record<string, string>;
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
      const next = { ...prev } as Record<string, string>;
      delete next[key];
      scheduleSave({ [key]: tokensByThemeState[theme][key] });
      return next;
    });
  };

  const handleGroupReset = (keys: string[]) => () => {
    setOverrides((prev) => {
      const next = { ...prev } as Record<string, string>;
      const patch: Record<string, string> = {};
      keys.forEach((k) => {
        delete next[k];
        patch[k] = tokensByThemeState[theme][k];
      });
      scheduleSave(patch);
      return next;
    });
  };

  const handleResetAll = () => {
    if (!window.confirm(String(t("Are you sure you want to reset all overrides?")))) {
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
    previewTokens,
    mergedTokens,
    handleOverrideChange,
    handleReset,
    handleGroupReset,
    handleResetAll,
  };
}
