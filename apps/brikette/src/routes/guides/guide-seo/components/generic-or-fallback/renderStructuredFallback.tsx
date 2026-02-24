import type { TFunction } from "i18next";

import type { GuideSeoTemplateContext, TocItem } from "../../types";
import type { StructuredFallback } from "../../utils/fallbacks";
import RenderFallbackStructured from "../fallback/RenderFallbackStructured";
import RenderInterrailAlias from "../fallback/RenderInterrailAlias";
import {
  computeGenericContentProps,
  getEnTranslatorCandidates,
  hasMeaningfulStructuredFallback,
  type makeBaseGenericProps,
  prefersStructuredFallbackWhenEn,
  resolveEnglishTranslator,
} from "../generic";

type GuidesTranslations = Parameters<typeof makeBaseGenericProps>[0]["translations"];
type HookI18n = Parameters<typeof makeBaseGenericProps>[0]["hookI18n"];
type GenericContentBase = Parameters<typeof computeGenericContentProps>[0]["base"];
type GenericContentMerged = ReturnType<typeof computeGenericContentProps>;

function shouldRenderStructuredFallbackBlock(params: {
  hasLocalizedContent: boolean;
  suppressUnlocalizedFallback?: boolean;
  preferManualWhenUnlocalized?: boolean;
  fallbackStructured: StructuredFallback | null;
  preferGenericWhenFallback?: boolean;
  preferFallbackEvenWhenEn: boolean;
}): boolean {
  const {
    hasLocalizedContent,
    suppressUnlocalizedFallback,
    preferManualWhenUnlocalized,
    fallbackStructured,
    preferGenericWhenFallback,
    preferFallbackEvenWhenEn,
  } = params;

  return (
    !hasLocalizedContent &&
    !suppressUnlocalizedFallback &&
    !preferManualWhenUnlocalized &&
    Boolean(fallbackStructured) &&
    (fallbackStructured?.source !== "guidesEn" || preferFallbackEvenWhenEn) &&
    !preferGenericWhenFallback
  );
}

function shouldRenderEnStructuredFastPath(params: {
  hasLocalizedContent: boolean;
  englishFallbackAllowed: boolean;
  fallbackStructured: StructuredFallback | null;
  renderGenericContent: boolean;
  preferManualWhenUnlocalized?: boolean;
}): boolean {
  const {
    hasLocalizedContent,
    englishFallbackAllowed,
    fallbackStructured,
    renderGenericContent,
    preferManualWhenUnlocalized,
  } = params;
  return (
    !hasLocalizedContent &&
    englishFallbackAllowed &&
    Boolean(fallbackStructured) &&
    fallbackStructured?.source === "guidesEn" &&
    renderGenericContent &&
    !preferManualWhenUnlocalized
  );
}

export function renderStructuredFallback(params: {
  guideKey: string;
  translations: GuidesTranslations;
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
  hookI18n: HookI18n;
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
    hasStructuredEnEffective: _hasStructuredEnEffective,
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
    shouldRenderStructuredFallbackBlock({
      hasLocalizedContent,
      suppressUnlocalizedFallback,
      preferManualWhenUnlocalized,
      fallbackStructured,
      preferGenericWhenFallback,
      preferFallbackEvenWhenEn,
    })
  ) {
    const aliasBlockEarly = RenderInterrailAlias({
      guideKey,
      lang: context.lang,
      translations,
      t,
      showTocWhenUnlocalized,
      ...(typeof suppressTocTitle === "boolean" ? { suppressTocTitle } : {}),
    });
    if (aliasBlockEarly) return aliasBlockEarly;

    if (fallbackStructured && hasMeaningfulStructuredFallback(fallbackStructured)) {
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
    shouldRenderEnStructuredFastPath({
      hasLocalizedContent,
      englishFallbackAllowed,
      fallbackStructured,
      renderGenericContent,
      preferManualWhenUnlocalized,
    })
  ) {
    if (fallbackStructured && hasMeaningfulStructuredFallback(fallbackStructured)) {
      try {
        const { hookCandidate, appCandidate } = getEnTranslatorCandidates(hookI18n);
        const tEn = resolveEnglishTranslator({
          hookCandidate,
          appCandidate,
          fallback: t as unknown as TFunction,
          guideKey,
        });
        const baseFast: GenericContentBase = { t: tEn, guideKey };
        const propsFast = computeGenericContentProps({
          base: baseFast,
          ...(typeof genericContentOptions !== "undefined" ? { genericContentOptions } : {}),
          structuredTocItems,
          ...(typeof customTocProvided === "boolean" ? { customTocProvided } : {}),
          hasLocalizedContent,
        });
        const preparedProps: GenericContentMerged = hasStructuredLocal
          ? { ...propsFast, suppressIntro: true }
          : propsFast;
        return renderGenericOnce(prepareProps(preparedProps));
      } catch { /* fall through */ }
    }
  }

  // Main path continues in caller
  return null;
}
