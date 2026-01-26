import { memo } from "react";
import type { TFunction } from "i18next";

import GenericContent from "@/components/guides/GenericContent";
import {
  hasRuntimeContentFallback,
  shouldSkipEnTranslatorForFallback,
} from "@/config/guide-overrides";
import i18n from "@/i18n";

import type { GuideSeoTemplateContext, TocItem } from "../../types";
import type { StructuredFallback } from "../../utils/fallbacks";
import {
  allowsEmptyRender,
  applyIntroSuppression,
  applySectionExtras,
  computeGenericContentProps,
  getEnTranslatorCandidates,
  hasManualParagraphFallback,
  hasManualStringFallback,
  makeBaseGenericProps,
  needsLegacySecondArgInvocation,
  preparePropsForRender,
  resolveEnglishTranslator,
  shouldRenderGenericContent as decideShouldRenderGeneric,
  withTranslator,
} from "../generic";

import { renderGenericFastPaths } from "./renderGenericFastPaths";
import { renderStructuredFallback } from "./renderStructuredFallback";

const MemoGenericContent = memo(GenericContent as any);

export function renderPrimaryContent(params: {
  lang: string;
  guideKey: string;
  translations: any;
  hookI18n: any;
  t: TFunction;
  context: GuideSeoTemplateContext;
  articleDescriptionResolved?: string;
  renderGenericContent: boolean;
  renderWhenEmpty?: boolean;
  hasLocalizedContent: boolean;
  suppressUnlocalizedFallback?: boolean;
  englishFallbackAllowed: boolean;
  hasStructuredLocal: boolean;
  hasStructuredEnEffective: boolean;
  hasRuntimeStructured: boolean;
  fallbackStructured: StructuredFallback | null;
  genericContentOptions?: { showToc?: boolean } | undefined;
  structuredTocItems?: TocItem[] | null | undefined;
  customTocProvided?: boolean;
  preferManualWhenUnlocalized?: boolean;
  preferGenericWhenFallback?: boolean;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  manualFallbackExists: boolean;
}): JSX.Element | null {
  const {
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
  } = params;

  // Create withTranslator wrapper
  const wrapWithTranslator = (p: unknown) =>
    withTranslator(p, {
      guideKey,
      lang,
      hasLocalizedContent,
      englishFallbackAllowed,
      translations,
      hookI18n,
      t,
    });

  const renderGenericOnce = (props: unknown): JSX.Element | null => {
    if (!hasLocalizedContent && preferManualWhenUnlocalized && !manualFallbackExists && !renderWhenEmpty) {
      return null;
    }
    return <MemoGenericContent {...(wrapWithTranslator(props) as any)} /> as any;
  };

  const prepareProps = (props: unknown): unknown =>
    preparePropsForRender(props, articleDescriptionResolved, context as any, structuredTocItems);

  const fastPathNode = renderGenericFastPaths({
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
  });

  if (fastPathNode) return fastPathNode;

  const structuredFallbackNode = renderStructuredFallback({
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
  });

  if (structuredFallbackNode) return structuredFallbackNode;

  // ========================================================================
  // MAIN GENERIC CONTENT RENDERING PATH
  // ========================================================================

  const hasStructured = hasStructuredLocal || hasStructuredEnEffective;

  if (renderGenericContent) {
    // preferGenericWhenFallback fast-path
    if (preferGenericWhenFallback && !hasLocalizedContent && englishFallbackAllowed && hasStructuredEnEffective) {
      try {
        const { hookCandidate, appCandidate } = getEnTranslatorCandidates(hookI18n);
        const tEn = resolveEnglishTranslator({
          hookCandidate,
          appCandidate,
          fallback: translations.tGuides as unknown as TFunction,
          guideKey,
        });
        const base: any = { t: tEn, guideKey };
        let props = computeGenericContentProps({
          base,
          ...(typeof genericContentOptions !== "undefined" ? { genericContentOptions } : {}),
          structuredTocItems,
          ...(typeof customTocProvided === "boolean" ? { customTocProvided } : {}),
          hasLocalizedContent,
        });
        props = applyIntroSuppression(props, hasStructuredLocal, context as any) as any;
        props = applySectionExtras(props, genericContentOptions as any) as any;
        return renderGenericOnce(prepareProps(props)) as any;
      } catch { /* fall through */ }
    }

    // Main gating logic
    if (!englishFallbackAllowed && !hasLocalizedContent) {
      // Skip GenericContent
    } else if (suppressUnlocalizedFallback && !hasLocalizedContent) {
      // Skip GenericContent
    } else if (
      preferManualWhenUnlocalized &&
      !hasStructuredLocal &&
      !(hasRuntimeContentFallback(guideKey) && hasRuntimeStructured)
    ) {
      // Skip GenericContent
    } else {
      const hasManualString = hasManualStringFallback(t, guideKey, hasLocalizedContent);
      const hasManualParagraph = hasManualParagraphFallback(t, guideKey, hasLocalizedContent);

      const structuredSource = (fallbackStructured as any)?.source;
      const shouldRenderGeneric = decideShouldRenderGeneric({
        ...(typeof preferManualWhenUnlocalized === "boolean" ? { preferManualWhenUnlocalized } : {}),
        hasLocalizedContent,
        guideKey,
        hasStructuredFallback: Boolean(fallbackStructured),
        ...(structuredSource === "guidesFallback" || structuredSource === "guidesEn"
          ? { structuredFallbackSource: structuredSource }
          : {}),
        ...(typeof preferGenericWhenFallback === "boolean" ? { preferGenericWhenFallback } : {}),
      });

      // Custom ToC override check
      const hasManualTocItems = Array.isArray(structuredTocItems) && structuredTocItems.length > 0;
      if (customTocProvided && !hasLocalizedContent && hasManualTocItems && !fallbackStructured) {
        // Fall through to manual rendering
      } else if (
        preferManualWhenUnlocalized &&
        !hasLocalizedContent &&
        !(hasRuntimeContentFallback(guideKey) && hasRuntimeStructured)
      ) {
        // Fall through to manual rendering
      } else if (!hasLocalizedContent && (hasManualString || hasManualParagraph)) {
        // Fall through to manual rendering
      } else if (!hasStructured && !hasStructuredEnEffective && !renderWhenEmpty) {
        // Empty structured case - check for route-specific allowances
        const allowViaRoute = allowsEmptyRender(guideKey) || (hasRuntimeContentFallback(guideKey) && hasRuntimeStructured);
        const allowViaPreferGeneric = Boolean(preferGenericWhenFallback && !hasLocalizedContent);

        if (allowViaRoute || allowViaPreferGeneric) {
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
      } else if (shouldRenderGeneric) {
        // Compute GenericContent props
        const baseProps = (() => {
          if (hasStructuredLocal) {
            return { t, guideKey } as const;
          }
          if (!hasLocalizedContent && englishFallbackAllowed && Boolean(renderWhenEmpty)) {
            try {
              const fixedFromHook = hookI18n?.getFixedT?.("en", "guides");
              const fixedFromApp = (i18n as any)?.getFixedT?.("en", "guides");
              const pick = (val: unknown): TFunction | undefined => (typeof val === "function" ? (val as TFunction) : undefined);
              const tEn = pick(fixedFromHook) ?? pick(fixedFromApp);
              if (tEn && !shouldSkipEnTranslatorForFallback(guideKey)) {
                return { t: tEn, guideKey } as const;
              }
            } catch { /* noop */ }
            return { t, guideKey } as const;
          }
          return makeBaseGenericProps({
            hasLocalizedContent,
            ...(typeof preferGenericWhenFallback === "boolean" ? { preferGenericWhenFallback } : {}),
            translations,
            hookI18n,
            guideKey,
            allowEnglishFallback: englishFallbackAllowed,
          });
        })();

        // Merge with EN translator if needed
        const mergedBase = (() => {
          let base = baseProps as any;
          if (
            !hasLocalizedContent &&
            englishFallbackAllowed &&
            preferGenericWhenFallback &&
            !renderWhenEmpty &&
            !shouldSkipEnTranslatorForFallback(guideKey)
          ) {
            try {
              const fixedFromHook = hookI18n?.getFixedT?.("en", "guides");
              const fixedFromApp = (i18n as any)?.getFixedT?.("en", "guides");
              const pick = (val: unknown): TFunction | undefined => (typeof val === "function" ? (val as TFunction) : undefined);
              const exactEn = pick(fixedFromHook) ?? pick(fixedFromApp);
              if (exactEn) base = { t: exactEn, guideKey } as typeof baseProps;
            } catch { /* noop */ }
          }
          return base as typeof baseProps;
        })();

        let genericProps = computeGenericContentProps({
          base: mergedBase as any,
          ...(typeof genericContentOptions !== "undefined" ? { genericContentOptions } : {}),
          structuredTocItems,
          ...(typeof customTocProvided === "boolean" ? { customTocProvided } : {}),
          hasLocalizedContent,
        });

        genericProps = applyIntroSuppression(genericProps, hasStructuredLocal, context as any) as any;
        genericProps = applySectionExtras(genericProps, genericContentOptions as any) as any;

        if (!hasStructured && !renderWhenEmpty && !preferGenericWhenFallback) {
          return null;
        }

        // Legacy second-arg invocation for specific guides
        if (needsLegacySecondArgInvocation(guideKey)) {
          try {
            void (GenericContent as any)(genericProps, (t as any) || {});
          } catch { /* noop */ }
        }

        return renderGenericOnce(prepareProps(genericProps)) as any;
      }
    }
  }

  return null;
}
