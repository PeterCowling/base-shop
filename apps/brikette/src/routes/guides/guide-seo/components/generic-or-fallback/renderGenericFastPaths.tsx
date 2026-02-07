import type { TFunction } from "i18next";

import type { TocItem } from "../../types";
import {
  computeGenericContentProps,
  makeBaseGenericProps,
  requiresStructuredEnForForceGeneric,
  shouldForceGenericWhenUnlocalized,
} from "../generic";

export function renderGenericFastPaths(params: {
  renderWhenEmpty?: boolean;
  hasLocalizedContent: boolean;
  hasStructuredLocal: boolean;
  hasStructuredEnEffective: boolean;
  translations: any;
  hookI18n: any;
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
    const baseProps = makeBaseGenericProps({
      hasLocalizedContent,
      preferGenericWhenFallback: true,
      translations,
      hookI18n,
      guideKey,
      allowEnglishFallback: englishFallbackAllowed,
    });
    let props = computeGenericContentProps({
      base: baseProps as any,
      ...(typeof genericContentOptions !== "undefined" ? { genericContentOptions } : {}),
      structuredTocItems,
      ...(typeof customTocProvided === "boolean" ? { customTocProvided } : {}),
      hasLocalizedContent,
    });
    if (hasStructuredLocal) {
      props = { ...(props as any), suppressIntro: true } as any;
    }
    return renderGenericOnce(prepareProps(props)) as any;
  }

  // Force generic for specific guides (e.g., backpackingSouthernItaly, avoidCrowdsPositano, praianoGuide)
  if (!hasLocalizedContent && shouldForceGenericWhenUnlocalized(guideKey)) {
    // Some guides require EN structured content to be present before rendering
    if (requiresStructuredEnForForceGeneric(guideKey) && !hasStructuredEnEffective) {
      return null;
    }
    const base = hasStructuredEnEffective
      ? makeBaseGenericProps({
          hasLocalizedContent,
          preferGenericWhenFallback: true,
          translations,
          hookI18n,
          guideKey,
          allowEnglishFallback: englishFallbackAllowed,
        })
      : { t, guideKey };

    const props = computeGenericContentProps({
      base: base as any,
      ...(typeof genericContentOptions !== "undefined" ? { genericContentOptions } : {}),
      structuredTocItems,
      ...(typeof customTocProvided === "boolean" ? { customTocProvided } : {}),
      hasLocalizedContent,
    });
    return renderGenericOnce(prepareProps(props)) as any;
  }

  return null;
}
