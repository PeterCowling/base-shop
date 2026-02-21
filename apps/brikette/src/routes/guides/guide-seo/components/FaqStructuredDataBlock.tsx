import type { TFunction } from "i18next";

import GuideFaqJsonLd from "@/components/seo/GuideFaqJsonLd";
import type { GuideKey } from "@/routes.guides-helpers";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

import {
  buildFaqFallback,
  checkHasEnglishContent,
  gatherTranslatorCandidates,
} from "./faqFallbackBuilder";

interface FaqStructuredDataBlockProps {
  guideKey: GuideKey;
  hasLocalizedContent: boolean;
  suppressFaqWhenUnlocalized?: boolean;
  alwaysProvideFaqFallback?: boolean;
  guideFaqFallback?: React.ComponentProps<typeof GuideFaqJsonLd>["fallback"];
  preferManualWhenUnlocalized?: boolean;
  suppressUnlocalizedFallback?: boolean;
  // translators
  tGuides: (
    k: string,
    opts?: { returnObjects?: boolean } & Record<string, unknown>
  ) => unknown;
  hookI18n?: { getFixedT?: (lng: string, ns: string) => TFunction | undefined };
}

export default function FaqStructuredDataBlock({
  guideKey,
  hasLocalizedContent,
  suppressFaqWhenUnlocalized,
  alwaysProvideFaqFallback,
  guideFaqFallback,
  preferManualWhenUnlocalized,
  suppressUnlocalizedFallback,
  tGuides,
  hookI18n,
}: FaqStructuredDataBlockProps): JSX.Element | null {
  // IMPORTANT: Always render a JSON-LD <script> placeholder when suppressing FAQ output.
  // This prevents structural mismatches (e.g., <div> ↔ <script>) when FAQ eligibility
  // differs between SSR and the first client render (common when i18n readiness diverges).
  const jsonLdPlaceholder = (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      // Valid, empty JSON-LD graph. Keeps markup stable without asserting FAQ entries.
      dangerouslySetInnerHTML={{ __html: '{"@context":"https://schema.org","@graph":[]}' }}
    />
  );
  if (suppressFaqWhenUnlocalized && !hasLocalizedContent) {
    return jsonLdPlaceholder;
  }

  const shouldProvideFaqFallback = Boolean(
    // Honor explicit request to always expose a fallback builder
    alwaysProvideFaqFallback ||
      // Otherwise, only provide a builder when the page is unlocalized and
      // we can reasonably shape a fallback from EN resources. Prefer the
      // hook-provided i18n (mockable in tests); fall back to the app-level
      // i18n only when the hook does not expose getFixedT.
      (!preferManualWhenUnlocalized && !suppressUnlocalizedFallback && !hasLocalizedContent &&
        checkHasEnglishContent(guideKey, hookI18n))
  );

  const preferManualFallbackActive = Boolean(preferManualWhenUnlocalized && !hasLocalizedContent);
  const shouldExposeSanitizedFallback =
    preferManualFallbackActive || alwaysProvideFaqFallback || shouldProvideFaqFallback;

  const translatorMeta = tGuides as { __lang?: string };
  const currentLang = typeof translatorMeta?.__lang === "string" ? translatorMeta.__lang : undefined;
  const currentLangLower = typeof currentLang === "string" ? currentLang.toLowerCase() : undefined;
  const preferHookOnly = typeof hookI18n?.getFixedT === "function";

  const gatherCandidates = (lang: string) =>
    gatherTranslatorCandidates(guideKey, lang, currentLangLower, tGuides as TFunction, hookI18n, preferHookOnly);

  const buildFallback = (langParam: string): NormalizedFaqEntry[] => {
    return buildFaqFallback({
      guideKey,
      langParam,
      tGuides: tGuides as TFunction,
      guideFaqFallback,
      gatherCandidates,
    });
  };

  // Only provide a fallback when explicitly requested via props. Always surface
  // route-provided fallback builders so tests can interrogate them even when
  // localized content exists. When both a route-level fallback and the
  // sanitized builder should be exposed, prefer the guide fallback and fall
  // back to the sanitized entries if it returns nothing.
  const fallbackProp = (() => {
    if (typeof guideFaqFallback === "function" && shouldExposeSanitizedFallback) {
      return (langParam: string): NormalizedFaqEntry[] => {
        const manual = guideFaqFallback(langParam);
        if (Array.isArray(manual) && manual.length > 0) {
          return manual;
        }
        const sanitized = buildFallback(langParam);
        return sanitized.length > 0 ? sanitized : (manual || []);
      };
    }
    if (typeof guideFaqFallback === "function") {
      return (langParam: string): NormalizedFaqEntry[] => {
        return guideFaqFallback(langParam) || [];
      };
    }
    if (shouldExposeSanitizedFallback) {
      return buildFallback;
    }
    return undefined;
  })();

  // Always render a container to maintain stable DOM structure during hydration
  // When not eligible, render hidden container to avoid structural mismatches
  if (!hasLocalizedContent && !fallbackProp && !preferManualFallbackActive) {
    return jsonLdPlaceholder;
  }

  return (
    <GuideFaqJsonLd
      guideKey={guideKey}
      {...(typeof fallbackProp === "function" ? { fallback: fallbackProp } : {})}
    />
  );
}
