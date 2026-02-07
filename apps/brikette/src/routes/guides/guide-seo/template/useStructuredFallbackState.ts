import { useMemo } from "react";

import i18n from "@/i18n";

import type { ManualStructuredFallbackResult } from "../components/ManualStructuredFallback";
import { computeManualStructuredFallback } from "../components/ManualStructuredFallback";
import {
  buildStructuredFallback,
  type StructuredFallback,
} from "../utils/fallbacks";

export function useStructuredFallbackState(params: {
  guideKey: string;
  lang: string;
  hookI18n: any;
  translations: { tGuides: (key: string, options?: Record<string, unknown>) => unknown };
  hasLocalizedContent: boolean;
  hasStructuredLocalInitial: boolean;
  preferManualWhenUnlocalized: boolean;
  suppressUnlocalizedFallback: boolean;
  translatorProvidedEmptyStructured: boolean;
}): {
  fallbackStructured: StructuredFallback | null;
  manualStructuredFallback: ManualStructuredFallbackResult;
} {
  const {
    guideKey,
    lang,
    hookI18n,
    translations,
    hasLocalizedContent,
    hasStructuredLocalInitial,
    preferManualWhenUnlocalized,
    suppressUnlocalizedFallback,
    translatorProvidedEmptyStructured,
  } = params;

  const fallbackStructured = useMemo<StructuredFallback | null>(
    () =>
      // Treat translator-provided structured arrays as localized for fallback
      // suppression. In test environments the i18n store may be empty even when
      // the active translator returns structured content; avoid probing getFixedT
      // (which tests assert should not be called) by short-circuiting here.
      buildStructuredFallback(
        guideKey,
        lang,
        hookI18n,
        i18n,
        Boolean(hasLocalizedContent || hasStructuredLocalInitial),
        // Routes that opt into manual handling for unlocalized locales should
        // suppress EN structured fallbacks even when the active locale is EN.
        // Tests assert that empty manual translations do not backfill with EN
        // structured sections when preferManualWhenUnlocalized is enabled.
        Boolean(preferManualWhenUnlocalized),
        // Provide the active guides translator so alternate/legacy keys in the
        // guides namespace (camel-cased from the slug) can be probed when the
        // primary structured arrays are absent. This enables localized
        // fallbacks like content.amalfiCoastPublicTransportGuide.* in tests.
        translations.tGuides as any,
      ),
    [
      guideKey,
      lang,
      hookI18n,
      hasLocalizedContent,
      hasStructuredLocalInitial,
      preferManualWhenUnlocalized,
      translations,
    ],
  );

  const manualStructuredFallback = useMemo(
    () =>
      computeManualStructuredFallback({
        fallback: fallbackStructured,
        hasLocalizedContent,
        preferManualWhenUnlocalized,
        suppressUnlocalizedFallback,
        translatorProvidedEmptyStructured,
        lang: lang as any,
      }),
    [
      fallbackStructured,
      hasLocalizedContent,
      lang,
      preferManualWhenUnlocalized,
      suppressUnlocalizedFallback,
      translatorProvidedEmptyStructured,
    ],
  );

  return { fallbackStructured, manualStructuredFallback };
}
