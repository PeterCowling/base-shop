import type { TFunction } from "i18next";

import type { GuideSeoTemplateContext, TocItem } from "../../types";
import type { StructuredFallback } from "../../utils/fallbacks";
import RenderFallbackStructured from "../fallback/RenderFallbackStructured";
import RenderInterrailAlias from "../fallback/RenderInterrailAlias";
import {
  computeGenericContentProps,
  getEnTranslatorCandidates,
  hasMeaningfulStructuredFallback,
  prefersStructuredFallbackWhenEn,
  resolveEnglishTranslator,
} from "../generic";

export function renderStructuredFallback(params: {
  guideKey: string;
  translations: any;
  t: TFunction;
  context: GuideSeoTemplateContext;
  fallbackStructured: StructuredFallback | null;
  hasLocalizedContent: boolean;
  suppressUnlocalizedFallback?: boolean;
  preferManualWhenUnlocalized?: boolean;
  preferGenericWhenFallback?: boolean;
  englishFallbackAllowed: boolean;
  renderGenericContent: boolean;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  hasStructuredLocal: boolean;
  hasStructuredEnEffective: boolean;
  genericContentOptions?: { showToc?: boolean } | undefined;
  structuredTocItems?: TocItem[] | null | undefined;
  customTocProvided?: boolean;
  hookI18n: any;
  renderGenericOnce: (props: unknown) => JSX.Element | null;
  prepareProps: (props: unknown) => unknown;
}): JSX.Element | null {
  const {
    guideKey,
    translations,
    t,
    context,
    fallbackStructured,
    hasLocalizedContent,
    suppressUnlocalizedFallback,
    preferManualWhenUnlocalized,
    preferGenericWhenFallback,
    englishFallbackAllowed,
    renderGenericContent,
    showTocWhenUnlocalized,
    suppressTocTitle,
    hasStructuredLocal,
    hasStructuredEnEffective,
    genericContentOptions,
    structuredTocItems,
    customTocProvided,
    hookI18n,
    renderGenericOnce,
    prepareProps,
  } = params;

  // ========================================================================
  // STRUCTURED FALLBACK RENDERING
  // ========================================================================

  const preferFallbackEvenWhenEn = prefersStructuredFallbackWhenEn(guideKey);

  if (
    !hasLocalizedContent &&
    !suppressUnlocalizedFallback &&
    !preferManualWhenUnlocalized &&
    fallbackStructured &&
    (((fallbackStructured as any)?.source !== "guidesEn") || preferFallbackEvenWhenEn) &&
    !preferGenericWhenFallback
  ) {
    const aliasBlockEarly = RenderInterrailAlias({
      guideKey,
      lang: context.lang,
      translations,
      t,
      showTocWhenUnlocalized,
      ...(typeof suppressTocTitle === "boolean" ? { suppressTocTitle } : {}),
    });
    if (aliasBlockEarly) return aliasBlockEarly as any;

    if (hasMeaningfulStructuredFallback(fallbackStructured)) {
      return (
        <RenderFallbackStructured
          fallback={fallbackStructured}
          context={context}
          guideKey={guideKey}
          t={t}
          showTocWhenUnlocalized={showTocWhenUnlocalized}
          {...(typeof suppressTocTitle === "boolean" ? { suppressTocTitle } : {})}
          {...(typeof preferManualWhenUnlocalized === "boolean" ? { preferManualWhenUnlocalized } : {})}
        />
      );
    }
  }

  // EN structured fallback fast-path
  if (
    !hasLocalizedContent &&
    englishFallbackAllowed &&
    fallbackStructured &&
    (fallbackStructured as any)?.source === "guidesEn" &&
    renderGenericContent &&
    !preferManualWhenUnlocalized
  ) {
    if (hasMeaningfulStructuredFallback(fallbackStructured)) {
      try {
        const { hookCandidate, appCandidate } = getEnTranslatorCandidates(hookI18n);
        const tEn = resolveEnglishTranslator({
          hookCandidate,
          appCandidate,
          fallback: t as unknown as TFunction,
          guideKey,
        });
        const baseFast = { t: tEn, guideKey } as const;
        let propsFast = computeGenericContentProps({
          base: baseFast as any,
          ...(typeof genericContentOptions !== "undefined" ? { genericContentOptions } : {}),
          structuredTocItems,
          ...(typeof customTocProvided === "boolean" ? { customTocProvided } : {}),
          hasLocalizedContent,
        });
        if (hasStructuredLocal) {
          propsFast = { ...(propsFast as any), suppressIntro: true } as any;
        }
        return renderGenericOnce(prepareProps(propsFast)) as any;
      } catch { /* fall through */ }
    }
  }

  // Main path continues in caller
  return null;
}
