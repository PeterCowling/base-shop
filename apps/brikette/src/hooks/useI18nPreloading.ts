// apps/brikette/src/hooks/useI18nPreloading.ts
// Consolidates duplicated i18n preloading logic from AppLayout.tsx and Root.tsx

import { useEffect, useLayoutEffect } from "react";

import { IS_DEV } from "@/config/env";
import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { CORE_LAYOUT_I18N_NAMESPACES } from "@/i18n.namespaces";
import { preloadI18nNamespaces } from "@/utils/loadI18nNs";

type NormalizeLang = (raw: string | undefined) => AppLanguage | undefined;

const defaultNormalize: NormalizeLang = (raw) => {
  const trimmed = raw?.toLowerCase();
  if (!trimmed) return undefined;
  const base = trimmed.split("-")[0];
  if (!base) return undefined;
  return (i18nConfig.supportedLngs as readonly string[]).includes(base)
    ? (base as AppLanguage)
    : undefined;
};

type UseI18nPreloadingOptions = {
  /** Language derived from current route */
  lang: AppLanguage;
  /** Custom language normalizer (defaults to extracting base language from locale string) */
  normalizeLang?: NormalizeLang;
  /** Namespaces to preload (defaults to CORE_LAYOUT_I18N_NAMESPACES) */
  namespaces?: readonly string[];
};

/**
 * Handles i18n language synchronization and namespace preloading.
 *
 * This hook:
 * 1. Syncs i18n instance language with the route-derived language
 * 2. Preloads namespaces for the current language
 * 3. Preloads namespaces when language changes
 * 4. Subscribes to language change events for dynamic preloading
 *
 * Extracted from AppLayout.tsx and Root.tsx to eliminate ~80 lines of duplication.
 */
export function useI18nPreloading({
  lang,
  normalizeLang = defaultNormalize,
  namespaces = CORE_LAYOUT_I18N_NAMESPACES,
}: UseI18nPreloadingOptions): void {
  // Sync i18n language with route-derived language
  useLayoutEffect(() => {
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang).catch((error) => {
        if (IS_DEV) {
          console.error(error);
        }
      });
    }
  }, [lang]);

  // Preload namespaces and subscribe to language changes
  useEffect(() => {
    const loadFor = async (next: string | undefined) => {
      const normalized = normalizeLang(next);
      const targetLang = normalized ?? lang;

      try {
        await preloadI18nNamespaces(targetLang, namespaces, { optional: true });
        if (typeof i18n.emit === "function") {
          i18n.emit("loaded", { [targetLang]: namespaces });
        }
      } catch (error) {
        if (IS_DEV) {
          console.error(error);
        }
      }
    };

    // Always prioritize the language derived from the current route so the
    // initial preload aligns with the rendered locale. If the i18n instance is
    // still pointing at a different language we trigger a secondary preload
    // below to warm its cache as well.
    void loadFor(lang);

    if (i18n.language && i18n.language !== lang) {
      void loadFor(i18n.language);
    }

    const handler = (next: string) => {
      void loadFor(next);
    };

    i18n.on("languageChanged", handler);

    return () => {
      i18n.off("languageChanged", handler);
    };
  }, [lang, namespaces, normalizeLang]);
}
