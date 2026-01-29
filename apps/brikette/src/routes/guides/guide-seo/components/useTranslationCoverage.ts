// src/routes/guides/guide-seo/components/useTranslationCoverage.ts
import { useEffect, useMemo, useState } from "react";

import { i18nConfig, type AppLanguage } from "@/i18n.config";
import i18n from "@/i18n";
import type { GuideKey } from "@/routes.guides-helpers";

import { analyzeTranslationCoverage } from "../../guide-diagnostics";
import type { TranslationCoverageResult } from "../../guide-diagnostics.types";

interface TranslationCoverageState {
  isLoading: boolean;
  coverage: TranslationCoverageResult | null;
  error: string | null;
}

/**
 * Computes translation coverage for a guide after hydration.
 * This runs client-side only (in useEffect) to avoid SSR/hydration mismatches.
 * The initial render returns loading state, then coverage is computed after mount.
 */
export function useTranslationCoverage(guideKey: string): TranslationCoverageState {
  const [state, setState] = useState<TranslationCoverageState>({
    isLoading: true,
    coverage: null,
    error: null,
  });

  const supportedLocales = useMemo(
    () => i18nConfig.supportedLngs as AppLanguage[],
    [],
  );

  useEffect(() => {
    if (!guideKey) {
      setState({ isLoading: false, coverage: null, error: null });
      return;
    }

    let active = true;

    const computeCoverage = () => {
      try {
        const coverage = analyzeTranslationCoverage(
          guideKey as GuideKey,
          supportedLocales,
        );
        if (active) {
          setState({ isLoading: false, coverage, error: null });
        }
      } catch (err) {
        if (active) {
          setState({ isLoading: false, coverage: null, error: String(err) });
        }
      }
    };

    const handleLoaded = (loaded?: Record<string, readonly string[]>) => {
      if (!loaded) {
        computeCoverage();
        return;
      }
      const namespaces = Object.values(loaded).flat();
      if (namespaces.includes("guides")) {
        computeCoverage();
      }
    };

    const handleAdded = (_lng: string, ns: string) => {
      if (ns === "guides") {
        computeCoverage();
      }
    };

    setState((prev) => ({ ...prev, isLoading: true }));
    computeCoverage();

    if (typeof i18n.on === "function") {
      i18n.on("loaded", handleLoaded);
      i18n.on("added", handleAdded);
    }

    return () => {
      active = false;
      if (typeof i18n.off === "function") {
        i18n.off("loaded", handleLoaded);
        i18n.off("added", handleAdded);
      }
    };
  }, [guideKey, supportedLocales]);

  return state;
}
