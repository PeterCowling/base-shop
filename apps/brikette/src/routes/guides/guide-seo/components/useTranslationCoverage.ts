// src/routes/guides/guide-seo/components/useTranslationCoverage.ts
import { useEffect, useState } from "react";

import { i18nConfig, type AppLanguage } from "@/i18n.config";
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

  useEffect(() => {
    if (!guideKey) {
      setState({ isLoading: false, coverage: null, error: null });
      return;
    }

    // Compute coverage after mount to avoid hydration mismatch
    try {
      const coverage = analyzeTranslationCoverage(
        guideKey as GuideKey,
        i18nConfig.supportedLngs as AppLanguage[],
      );
      setState({ isLoading: false, coverage, error: null });
    } catch (err) {
      setState({ isLoading: false, coverage: null, error: String(err) });
    }
  }, [guideKey]);

  return state;
}
