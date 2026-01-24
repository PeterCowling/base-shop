// apps/brikette/src/hooks/usePagePreload.ts
// Replaces duplicated useEffect patterns for page-level namespace preloading.

import { useEffect } from "react";

import { IS_DEV } from "@/config/env";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { preloadI18nNamespaces, preloadNamespacesWithFallback } from "@/utils/loadI18nNs";

type UsePagePreloadOptions = {
  /** Primary language to load */
  lang: AppLanguage;
  /** Required namespaces (loaded with fallback) */
  namespaces: readonly string[];
  /** Optional namespaces (failures are silently ignored) */
  optionalNamespaces?: readonly string[];
  /** Mark required namespaces as optional too (default: false) */
  optional?: boolean;
};

/**
 * Preloads i18n namespaces on mount and syncs the i18n language.
 *
 * Extracts the repeated pattern found across all page content components:
 * ```
 * useEffect(() => {
 *   await preloadNamespacesWithFallback(lang, [...]);
 *   await i18n.changeLanguage(lang);
 * }, [lang]);
 * ```
 */
export function usePagePreload({
  lang,
  namespaces,
  optionalNamespaces,
  optional = false,
}: UsePagePreloadOptions): void {
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        await preloadNamespacesWithFallback(lang, namespaces, { optional });
        if (optionalNamespaces?.length) {
          await preloadI18nNamespaces(lang, optionalNamespaces, { optional: true });
        }
        if (!cancelled) {
          await i18n.changeLanguage(lang);
        }
      } catch (err) {
        if (IS_DEV) console.debug("[usePagePreload] failed", lang, namespaces, err);
      }
    };

    void load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- namespaces arrays are stable per component
  }, [lang]);
}
