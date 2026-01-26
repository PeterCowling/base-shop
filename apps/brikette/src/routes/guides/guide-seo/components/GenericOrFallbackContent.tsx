// src/routes/guides/guide-seo/components/GenericOrFallbackContent.tsx
/* eslint-disable @typescript-eslint/no-explicit-any, ds/no-hardcoded-copy -- DEV-000: Extracted from _GuideSeoTemplate for test parity. */
import { useMemo } from "react";
import type { TFunction } from "i18next";

import { debugGuide } from "@/utils/debug";
import { allowEnglishGuideFallback } from "@/utils/guideFallbackPolicy";

import type { GuideSeoTemplateContext, TocItem } from "../types";
import type { StructuredFallback } from "../utils/fallbacks";

import RenderManualObject from "./fallback/RenderManualObject";
import {
  computeHasStructuredEn,
  getLocalizedManualFallback,
  hasExplicitLocalizedContent,
  hasRuntimeStructuredContent,
  hasStructuredEn as probeHasStructuredEn,
  hasStructuredLocal as probeHasStructuredLocal,
  manualFallbackHasMeaningfulContent,
  resolveTargetLocale,
  shouldSkipFallbacksWhenUnlocalized,
  shouldSkipWhenPureEmpty,
} from "./generic";
import { renderFallbackContent } from "./generic-or-fallback/renderFallbackContent";
import { renderPrimaryContent } from "./generic-or-fallback/renderPrimaryContent";

interface Props {
  lang: string;
  requestedLang?: string;
  guideKey: string;
  translations: any;
  t: TFunction;
  hookI18n: any;
  context: GuideSeoTemplateContext;
  articleDescription?: string;
  renderGenericContent: boolean;
  renderWhenEmpty?: boolean;
  suppressUnlocalizedFallback?: boolean;
  hasLocalizedContent: boolean;
  genericContentOptions?: { showToc?: boolean } | undefined;
  structuredTocItems?: TocItem[] | null | undefined;
  customTocProvided?: boolean;
  preferManualWhenUnlocalized?: boolean;
  preferGenericWhenFallback?: boolean;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  fallbackStructured: StructuredFallback | null;
  manualStructuredFallbackRendered?: boolean;
}

export default function GenericOrFallbackContent({
  lang,
  requestedLang,
  guideKey,
  translations,
  t,
  hookI18n,
  context,
  articleDescription,
  renderGenericContent,
  renderWhenEmpty,
  suppressUnlocalizedFallback,
  hasLocalizedContent,
  genericContentOptions,
  structuredTocItems,
  customTocProvided,
  preferManualWhenUnlocalized,
  preferGenericWhenFallback,
  showTocWhenUnlocalized,
  suppressTocTitle,
  fallbackStructured,
  manualStructuredFallbackRendered,
}: Props): JSX.Element | null {
  // Resolve locales
  const targetLocale = resolveTargetLocale(requestedLang, lang);
  const englishFallbackAllowed = allowEnglishGuideFallback(lang);

  // Resolve article description
  const articleDescriptionResolved =
    typeof articleDescription === "string"
      ? articleDescription
      : typeof (context as any)?.article?.description === "string"
      ? ((context as any).article.description as string)
      : undefined;

  // Probe for structured content
  const hasStructuredLocal = probeHasStructuredLocal(translations, guideKey);
  const hasStructuredEnEffective = computeHasStructuredEn({
    hasLocalizedContent,
    probeHasStructuredEn: probeHasStructuredEn(hookI18n, hasLocalizedContent, guideKey),
    translations,
    guideKey,
  });
  const hasRuntimeStructured = hasRuntimeStructuredContent(lang, guideKey, hasLocalizedContent);
  const localizedManualFallback = getLocalizedManualFallback(lang, guideKey);

  // Check explicit localization for target
  const hasExplicitLocalizedForTarget = useMemo(
    () => hasExplicitLocalizedContent({ targetLocale, guideKey, hasLocalizedContent }),
    [targetLocale, guideKey, hasLocalizedContent],
  );

  // Debug logging
  try {
    debugGuide("GenericContent localized manual fallback", {
      guideKey,
      lang,
      hasLocalizedContent,
      manualFallbackType: localizedManualFallback == null ? null : typeof localizedManualFallback,
    });
  } catch {/* noop */}

  // ========================================================================
  // EARLY EXITS - Guide-specific policies
  // ========================================================================

  // Skip GenericContent for pure-empty guides (e.g., limoncelloCuisine)
  if (shouldSkipWhenPureEmpty(guideKey)) {
    if (!hasLocalizedContent && !hasStructuredLocal && !hasStructuredEnEffective) {
      return null;
    }
  }

  // Skip fallbacks entirely for specific guides (e.g., workExchangeItaly)
  if (shouldSkipFallbacksWhenUnlocalized(guideKey) && !hasLocalizedContent) {
    return null;
  }

  // ========================================================================
  // MANUAL FALLBACK DETECTION
  // ========================================================================

  let manualFallbackExists = false;
  let manualLocalMeaningful = false;
  let manualEnMeaningful = false;

  // Check for manual fallback when unlocalized
  if (!hasLocalizedContent && !preferGenericWhenFallback && !suppressUnlocalizedFallback) {
    // Suppress all fallback rendering when locale defines malformed manual fallback
    try {
      const kProbe = `content.${guideKey}.fallback` as const;
      const raw = translations?.tGuides?.(kProbe, { returnObjects: true }) as unknown;
      if (raw != null && (typeof raw !== 'object' || Array.isArray(raw))) {
        if (!Array.isArray(raw) || raw.length > 0) {
          return null;
        }
      }
    } catch { /* noop */ }

    // Check manual fallback content
    try {
      const kManual = `content.${guideKey}.fallback` as const;
      const localManualRaw =
        localizedManualFallback && typeof localizedManualFallback === "object" && !Array.isArray(localizedManualFallback)
          ? localizedManualFallback
          : (translations?.tGuides?.(kManual, { returnObjects: true }) as unknown);
      const enManualRaw = englishFallbackAllowed
        ? (() => {
            try {
              const fixed = (hookI18n as any)?.getFixedT?.("en", "guides");
              if (typeof fixed === 'function') return fixed(kManual, { returnObjects: true }) as unknown;
            } catch { /* noop */ }
            return undefined;
          })()
        : undefined;

      manualLocalMeaningful = manualFallbackHasMeaningfulContent(localManualRaw);
      manualEnMeaningful = manualFallbackHasMeaningfulContent(enManualRaw);
      const allowEnglishManual = englishFallbackAllowed && !preferManualWhenUnlocalized;
      const hasManual = manualLocalMeaningful || (allowEnglishManual && manualEnMeaningful);

      if (manualLocalMeaningful) manualFallbackExists = true;

      if (hasManual) {
        manualFallbackExists = true;
        return (
          <RenderManualObject
            translations={translations}
            hookI18n={hookI18n}
            guideKey={guideKey as any}
            t={t as any}
            showTocWhenUnlocalized={showTocWhenUnlocalized}
            {...(typeof suppressTocTitle === "boolean" ? { suppressTocTitle } : {})}
          />
        ) as any;
      }
    } catch { /* noop */ }
  }

  // Early manual fallback rendering
  if (!hasLocalizedContent && !suppressUnlocalizedFallback) {
    const allowEnglishManual = englishFallbackAllowed && !preferManualWhenUnlocalized;
    const shouldRenderManual = manualLocalMeaningful || (allowEnglishManual && manualEnMeaningful);
    if (shouldRenderManual) {
      const manualEarly = RenderManualObject({
        translations,
        hookI18n,
        guideKey: guideKey as any,
        t: t as any,
        showTocWhenUnlocalized,
        ...(typeof suppressTocTitle === "boolean" ? { suppressTocTitle } : {}),
      });
      if (manualEarly) {
        manualFallbackExists = true;
        return manualEarly as any;
      }
    }
  }

  // Skip GenericContent when route prefers manual and suppresses fallbacks
  if (
    !hasExplicitLocalizedForTarget &&
    preferManualWhenUnlocalized &&
    suppressUnlocalizedFallback &&
    !renderWhenEmpty
  ) {
    return null;
  }

  // ========================================================================
  // PRIMARY CONTENT RENDERING
  // ========================================================================

  const hasStructured = hasStructuredLocal || hasStructuredEnEffective;

  const primaryNode = renderPrimaryContent({
    lang,
    guideKey,
    translations,
    hookI18n,
    t,
    context,
    articleDescriptionResolved,
    renderGenericContent,
    renderWhenEmpty,
    hasLocalizedContent,
    suppressUnlocalizedFallback,
    englishFallbackAllowed,
    hasStructuredLocal,
    hasStructuredEnEffective,
    hasRuntimeStructured,
    fallbackStructured,
    genericContentOptions,
    structuredTocItems,
    customTocProvided,
    preferManualWhenUnlocalized,
    preferGenericWhenFallback,
    showTocWhenUnlocalized,
    suppressTocTitle,
    manualFallbackExists,
  });

  if (primaryNode) return primaryNode;

  return renderFallbackContent({
    lang,
    guideKey,
    translations,
    hookI18n,
    t,
    context,
    fallbackStructured,
    hasStructured,
    hasStructuredLocal,
    hasLocalizedContent,
    renderGenericContent,
    suppressUnlocalizedFallback,
    preferManualWhenUnlocalized,
    showTocWhenUnlocalized,
    suppressTocTitle,
    localizedManualFallback,
    manualStructuredFallbackRendered,
  });
}
