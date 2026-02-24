import type { TFunction } from "i18next";

import type { TocItem } from "../../types";
import {
  computeGenericContentProps,
  makeBaseGenericProps,
  requiresStructuredEnForForceGeneric,
  shouldForceGenericWhenUnlocalized,
} from "../generic";

type GuidesTranslations = Parameters<typeof makeBaseGenericProps>[0]["translations"];
type HookI18n = Parameters<typeof makeBaseGenericProps>[0]["hookI18n"];
type GenericContentBase = Parameters<typeof computeGenericContentProps>[0]["base"];
type GenericContentMerged = ReturnType<typeof computeGenericContentProps>;

export function renderGenericFastPaths(params: {
  renderWhenEmpty?: boolean;
  hasLocalizedContent: boolean;
  hasStructuredLocal: boolean;
  hasStructuredEnEffective: boolean;
  translations: GuidesTranslations;
  hookI18n: HookI18n;
  guideKey: string;
  englishFallbackAllowed: boolean;
  genericContentOptions?: { showToc?: boolean } | undefined;
  structuredTocItems?: TocItem[] | null | undefined;
  customTocProvided?: boolean;
  t: TFunction;
  renderGenericOnce: (props: unknown) => JSX.Element | null;
  prepareProps: (props: unknown) => unknown;
}): JSX.Element | null {
  const {
    renderWhenEmpty,
    hasLocalizedContent,
    hasStructuredLocal,
    hasStructuredEnEffective,
    translations,
    hookI18n,
    guideKey,
    englishFallbackAllowed,
    genericContentOptions,
    structuredTocItems,
    customTocProvided,
    t,
    renderGenericOnce,
    prepareProps,
  } = params;

  // renderWhenEmpty fast path
  if (renderWhenEmpty && !hasLocalizedContent) {
    const baseProps: GenericContentBase = makeBaseGenericProps({
      hasLocalizedContent,
      preferGenericWhenFallback: true,
      translations,
      hookI18n,
      guideKey,
      allowEnglishFallback: englishFallbackAllowed,
    });
    let props: GenericContentMerged = computeGenericContentProps({
      base: baseProps,
      ...(typeof genericContentOptions !== "undefined" ? { genericContentOptions } : {}),
      structuredTocItems,
      ...(typeof customTocProvided === "boolean" ? { customTocProvided } : {}),
      hasLocalizedContent,
    });
    if (hasStructuredLocal) {
      props = { ...props, suppressIntro: true };
    }
    return renderGenericOnce(prepareProps(props));
  }

  // Force generic for specific guides (e.g., backpackingSouthernItaly, avoidCrowdsPositano, praianoGuide)
  if (!hasLocalizedContent && shouldForceGenericWhenUnlocalized(guideKey)) {
    // Some guides require EN structured content to be present before rendering
    if (requiresStructuredEnForForceGeneric(guideKey) && !hasStructuredEnEffective) {
      return null;
    }
    const base: GenericContentBase = hasStructuredEnEffective
      ? makeBaseGenericProps({
          hasLocalizedContent,
          preferGenericWhenFallback: true,
          translations,
          hookI18n,
          guideKey,
          allowEnglishFallback: englishFallbackAllowed,
        })
      : { t, guideKey };

    const props: GenericContentMerged = computeGenericContentProps({
      base,
      ...(typeof genericContentOptions !== "undefined" ? { genericContentOptions } : {}),
      structuredTocItems,
      ...(typeof customTocProvided === "boolean" ? { customTocProvided } : {}),
      hasLocalizedContent,
    });
    return renderGenericOnce(prepareProps(props));
  }

  return null;
}
