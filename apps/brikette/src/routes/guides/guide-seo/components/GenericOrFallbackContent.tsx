// src/routes/guides/guide-seo/components/GenericOrFallbackContent.tsx
/* eslint-disable @typescript-eslint/no-explicit-any, ds/no-hardcoded-copy -- DEV-000: Extracted from _GuideSeoTemplate for test parity. */
import { memo, useMemo } from "react";
import type { TFunction } from "i18next";

import GenericContent from "@/components/guides/GenericContent";
import { IS_DEV } from "@/config/env";
import i18n from "@/i18n";
import { debugGuide } from "@/utils/debug";
import { allowEnglishGuideFallback } from "@/utils/guideFallbackPolicy";
import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";

import type { GuideSeoTemplateContext, TocItem } from "../types";
import type { StructuredFallback } from "../utils/fallbacks";

import RenderFallbackStructured from "./fallback/RenderFallbackStructured";
import RenderInterrailAlias from "./fallback/RenderInterrailAlias";
import RenderManualObject from "./fallback/RenderManualObject";
import RenderManualParagraph from "./fallback/RenderManualParagraph";
import RenderManualString from "./fallback/RenderManualString";
import RenderStructuredArrays from "./fallback/RenderStructuredArrays";
import {
  hasStructuredLocal as probeHasStructuredLocal,
  hasStructuredEn as probeHasStructuredEn,
  shouldRenderGenericContent as decideShouldRenderGeneric,
  computeGenericContentProps,
  makeBaseGenericProps,
  withTranslator,
  resolveEnglishTranslator,
  getEnTranslatorCandidates,
  manualFallbackHasMeaningfulContent,
  computeHasStructuredEn,
  hasRuntimeStructuredContent,
  hasExplicitLocalizedContent,
  hasMeaningfulStructuredFallback,
  getLocalizedManualFallback,
  resolveTargetLocale,
  hasManualFallbackMeaningfulContent,
  hasManualStringFallback,
  hasManualParagraphFallback,
  hasOnlyFaqs,
  resolveFallbackTranslator,
  shouldSkipWhenPureEmpty,
  allowsEmptyRender,
  prefersStructuredFallbackWhenEn,
  shouldSkipFallbacksWhenUnlocalized,
  shouldForceGenericWhenUnlocalized,
  needsLegacySecondArgInvocation,
  allowsStructuredArraysWhenLocalized,
  preparePropsForRender,
  applySectionExtras,
  applyIntroSuppression,
} from "./generic";

const MemoGenericContent = memo(GenericContent as any);

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
  // GENERIC CONTENT RENDERING HELPERS
  // ========================================================================

  const renderGenericOnce = (props: unknown): JSX.Element | null => {
    if (!hasLocalizedContent && preferManualWhenUnlocalized && !manualFallbackExists && !renderWhenEmpty) {
      return null;
    }
    return <MemoGenericContent {...(wrapWithTranslator(props) as any)} /> as any;
  };

  const prepareProps = (props: unknown): unknown =>
    preparePropsForRender(props, articleDescriptionResolved, context as any, structuredTocItems);

  // ========================================================================
  // GUIDE-SPECIFIC FAST PATHS
  // ========================================================================

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
    // For avoidCrowdsPositano, only render if EN structured exists
    if (guideKey === "avoidCrowdsPositano" && !hasStructuredEnEffective) {
      // Fall through to normal gating
    } else {
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
  }

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
    (fallbackStructured as any)?.source === 'guidesEn' &&
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

  // ========================================================================
  // MAIN GENERIC CONTENT RENDERING PATH
  // ========================================================================

  let hasStructured = hasStructuredLocal || hasStructuredEnEffective;

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
      !(guideKey === "whatToPack" && hasRuntimeStructured)
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
        !(guideKey === "whatToPack" && hasRuntimeStructured)
      ) {
        // Fall through to manual rendering
      } else if (!hasLocalizedContent && (hasManualString || hasManualParagraph)) {
        // Fall through to manual rendering
      } else if (!hasStructured && !hasStructuredEnEffective && !renderWhenEmpty) {
        // Empty structured case - check for route-specific allowances
        const allowViaRoute = allowsEmptyRender(guideKey) || (guideKey === "whatToPack" && hasRuntimeStructured);
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
              if (tEn && guideKey !== "etiquetteItalyAmalfi") {
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
            guideKey !== "etiquetteItalyAmalfi"
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

  // ========================================================================
  // FALLBACK RENDERING
  // ========================================================================

  try {
    debugGuide("GenericContent skipped — rendering fallbacks", {
      guideKey,
      lang,
      hasStructured,
      hasLocalizedContent,
    });
  } catch {}

  if (suppressUnlocalizedFallback && !hasLocalizedContent) {
    return null;
  }

  // Manual string/paragraph fallbacks
  const manualStringEarly = RenderManualString({ translations, hookI18n, guideKey });
  if (manualStringEarly) return manualStringEarly as any;

  const manualParagraphEarly = RenderManualParagraph({ translations, hookI18n, guideKey });
  if (manualParagraphEarly) return manualParagraphEarly as any;

  // Suppress fallback when manual fallback sanitizes to nothing
  if (!hasLocalizedContent) {
    try {
      const rawManual =
        localizedManualFallback && typeof localizedManualFallback === "object" && !Array.isArray(localizedManualFallback)
          ? (localizedManualFallback as Record<string, unknown>)
          : ((translations?.tGuides?.(`content.${guideKey}.fallback`, { returnObjects: true } as any) as unknown) as Record<string, unknown>);

      if (rawManual && typeof rawManual === 'object' && !Array.isArray(rawManual)) {
        if (!hasManualFallbackMeaningfulContent(rawManual)) {
          return null;
        }
      }
    } catch { /* noop */ }
  }

  // Resolve fallback translator
  const tFb = resolveFallbackTranslator(fallbackStructured, hookI18n, lang, translations);

  // Interrail alias block
  const aliasBlock = RenderInterrailAlias({
    guideKey,
    translations,
    t,
    showTocWhenUnlocalized,
    ...(typeof suppressTocTitle === "boolean" ? { suppressTocTitle } : {}),
  });
  if (aliasBlock) return aliasBlock as any;

  // Interrail FAQs-only rendering
  if (guideKey === "interrailAmalfi") {
    const interrailFaqsBlock = renderInterrailFaqsOnly({
      context,
      hasStructuredLocal,
      translations,
      tFb,
      guideKey,
      t,
    });
    if (interrailFaqsBlock) return interrailFaqsBlock;
  }

  // Suppress duplicate content when localized sections exist
  if (
    fallbackStructured &&
    hasLocalizedContent &&
    Array.isArray((context as any)?.sections) &&
    (context as any).sections.length > 0
  ) {
    return null;
  }

  // Render structured fallback
  if (
    fallbackStructured &&
    !suppressUnlocalizedFallback &&
    (preferManualWhenUnlocalized || !renderGenericContent) &&
    !manualStructuredFallbackRendered
  ) {
    if (!hasMeaningfulStructuredFallback(fallbackStructured)) {
      return null;
    }
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

  // Manual object fallback (unlocalized only)
  if (!hasLocalizedContent && !suppressUnlocalizedFallback) {
    const manualObject = RenderManualObject({
      translations,
      hookI18n,
      guideKey,
      t,
      showTocWhenUnlocalized,
      ...(typeof suppressTocTitle === "boolean" ? { suppressTocTitle } : {}),
      fallbackTranslator: tFb,
    });
    if (manualObject) {
      if (IS_DEV && process.env["DEBUG_TOC"] === "1") {
        console.info("[GenericOrFallbackContent:return:manualObject]");
      }
      return manualObject as any;
    }
  }

  // Structured arrays rendering
  if (hasLocalizedContent) {
    try {
      const introArr = Array.isArray((context as any)?.intro) ? ((context as any).intro as unknown[]) : [];
      const hasIntro = introArr.length > 0;
      const sectionsArr = Array.isArray((context as any)?.sections) ? ((context as any).sections as unknown[]) : [];
      const hasSections = sectionsArr.some((s: any) => Array.isArray(s?.body) && s.body.length > 0);
      if (hasIntro && hasSections && !allowsStructuredArraysWhenLocalized(guideKey)) {
        return null;
      }
    } catch {
      if (!allowsStructuredArraysWhenLocalized(guideKey)) {
        return null;
      }
    }
  }

  const allowManualStructuredFallback = Boolean(preferManualWhenUnlocalized && !suppressUnlocalizedFallback);
  if (allowManualStructuredFallback) {
    try {
      if (hasOnlyFaqs(fallbackStructured, tFb, guideKey)) {
        return null;
      }
    } catch { /* noop */ }
  }

  const shouldRenderStructuredFallback =
    (!hasLocalizedContent && !suppressUnlocalizedFallback) || allowManualStructuredFallback;
  if (shouldRenderStructuredFallback) {
    const structuredArrays = RenderStructuredArrays({
      tFb,
      translations,
      guideKey,
      t,
      showTocWhenUnlocalized,
      ...(typeof suppressTocTitle === "boolean" ? { suppressTocTitle } : {}),
      context: context as any,
      ...(typeof preferManualWhenUnlocalized === "boolean" ? { preferManualWhenUnlocalized } : {}),
      ...(typeof manualStructuredFallbackRendered === "boolean" ? { manualStructuredFallbackRendered } : {}),
    });
    if (structuredArrays) return structuredArrays as any;
  }

  // Final guard for manual handling preference
  if (preferManualWhenUnlocalized && !hasLocalizedContent) {
    try {
      const toArr = (v: unknown): string[] => (Array.isArray(v) ? (v as unknown[]).map((x) => (typeof x === 'string' ? x.trim() : String(x))).filter((s) => s.length > 0) : []);
      const introLocal = toArr((translations as any)?.tGuides?.(`content.${guideKey}.intro`, { returnObjects: true }));
      const sectionsLocal = (() => {
        const raw = (translations as any)?.tGuides?.(`content.${guideKey}.sections`, { returnObjects: true });
        const list = Array.isArray(raw) ? (raw as unknown[]) : [];
        return list
          .map((s) => {
            if (!s || typeof s !== 'object') return 0;
            const title = typeof (s as any).title === 'string' ? (s as any).title.trim() : '';
            const body = toArr((s as any).body ?? (s as any).items);
            return title.length > 0 || body.length > 0 ? 1 : 0;
          })
          .reduce<number>((a, b) => a + b, 0);
      })();
      const introFb = toArr((tFb as any)?.(`content.${guideKey}.intro`, { returnObjects: true }));
      const sectionsFb = (() => {
        const raw = (tFb as any)?.(`content.${guideKey}.sections`, { returnObjects: true });
        const list = Array.isArray(raw) ? (raw as unknown[]) : [];
        return list
          .map((s) => {
            if (!s || typeof s !== 'object') return 0;
            const title = typeof (s as any).title === 'string' ? (s as any).title.trim() : '';
            const body = toArr((s as any).body ?? (s as any).items);
            return title.length > 0 || body.length > 0 ? 1 : 0;
          })
          .reduce<number>((a, b) => a + b, 0);
      })();
      const hasMeaningful = (introLocal.length + sectionsLocal + introFb.length + sectionsFb) > 0;
      if (!hasMeaningful) return null;
    } catch { /* noop */ }
  }

  return null;
}

// ========================================================================
// HELPER COMPONENTS
// ========================================================================

/**
 * Render Interrail FAQs-only section when no localized intro/sections exist.
 */
function renderInterrailFaqsOnly(params: {
  context: GuideSeoTemplateContext;
  hasStructuredLocal: boolean;
  translations: any;
  tFb: TFunction | undefined;
  guideKey: string;
  t: TFunction;
}): JSX.Element | null {
  const { context, hasStructuredLocal, translations, tFb, guideKey, t } = params;

  try {
    const localizedStructuredExists = (() => {
      if (hasStructuredLocal) return true;
      try {
        const introArr = Array.isArray((context as any)?.intro) ? ((context as any).intro as unknown[]) : [];
        const hasIntro = introArr.some((p) => typeof p === "string" && p.trim().length > 0);
        if (hasIntro) return true;
      } catch { /* noop */ }
      try {
        const sectionsArr = Array.isArray((context as any)?.sections) ? ((context as any).sections as unknown[]) : [];
        const hasSections = sectionsArr.some((section: any) => {
          if (!section || typeof section !== "object") return false;
          const title = typeof section.title === "string" ? section.title.trim() : "";
          if (title.length > 0) return true;
          const body = Array.isArray(section.body)
            ? (section.body as unknown[])
            : Array.isArray(section.items)
            ? (section.items as unknown[])
            : [];
          return body.some((value) => typeof value === "string" && value.trim().length > 0);
        });
        if (hasSections) return true;
      } catch { /* noop */ }
      return false;
    })();

    if (localizedStructuredExists) return null;

    type AliasFaqEntry = { q?: string; a?: unknown; answer?: unknown };
    const mapFaqs = (entries: AliasFaqEntry[] | undefined) =>
      ensureArray<AliasFaqEntry>(entries)
        .map((entry) => ({
          q: typeof entry?.q === "string" ? entry.q.trim() : "",
          a: ensureStringArray((entry as any)?.a ?? (entry as any)?.answer),
        }))
        .filter((faq) => faq.q.length > 0 && faq.a.length > 0);

    let aliasFaqsSource = ensureArray<AliasFaqEntry>(
      (tFb as any)?.("interrailItalyRailPassAmalfiCoast.faqs", { returnObjects: true } as any),
    );
    if (aliasFaqsSource.length === 0) {
      aliasFaqsSource = ensureArray<AliasFaqEntry>(
        (tFb as any)?.("content.interrailItalyRailPassAmalfiCoast.faqs", { returnObjects: true } as any),
      );
    }
    const aliasFaqsRaw = mapFaqs(aliasFaqsSource);

    const genericFaqsRaw = mapFaqs(
      ensureArray<AliasFaqEntry>(
        (translations as any)?.tGuides?.(`content.${guideKey}.faqs`, { returnObjects: true } as any) as unknown,
      ),
    );

    const combined = [...genericFaqsRaw, ...aliasFaqsRaw];
    if (combined.length === 0) return null;

    const aliasLabel = (() => {
      try {
        const tocKey = "content.interrailItalyRailPassAmalfiCoast.toc.faqs" as const;
        const tocRaw = translations.tGuides?.(tocKey) as unknown as string;
        const tocLabel = typeof tocRaw === "string" ? tocRaw.trim() : "";
        if (tocLabel.length > 0 && tocLabel !== tocKey) return tocLabel;
      } catch { /* noop */ }
      try {
        const kA1 = "content.interrailItalyRailPassAmalfiCoast.faqsTitle" as const;
        const r1 = (tFb as any)?.(kA1) as unknown as string;
        const s1 = typeof r1 === "string" ? r1.trim() : "";
        if (s1.length > 0 && s1 !== kA1) return s1;
      } catch { /* noop */ }
      try {
        const kA2 = "interrailItalyRailPassAmalfiCoast.faqsTitle" as const;
        const r2 = (tFb as any)?.(kA2) as unknown as string;
        const s2 = typeof r2 === "string" ? r2.trim() : "";
        if (s2.length > 0 && s2 !== kA2) return s2;
      } catch { /* noop */ }
      return (t("labels.faqsHeading", { defaultValue: "FAQs" }) as string) ?? "FAQs";
    })();

    return (
      <section id="faqs" className="space-y-4">
        <h2 className="text-pretty text-2xl font-semibold leading-snug tracking-tight text-brand-heading sm:text-3xl">
          {aliasLabel}
        </h2>
        <div className="space-y-4">
          {combined.map((faq, index) => (
            <details
              key={`${faq.q}-${index}`}
              className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-surface/40 shadow-sm transition-shadow hover:shadow-md dark:border-brand-outline/40 dark:bg-brand-bg/60"
            >
              <summary
                role="button"
                className="px-4 py-3 text-lg font-semibold leading-snug text-brand-heading sm:text-xl"
              >
                {faq.q}
              </summary>
              <div className="space-y-3 px-4 pb-4 pt-1 text-base leading-relaxed text-brand-text/90 sm:text-lg">
                {faq.a.map((answer, answerIndex) => (
                  <p key={`${faq.q}-${answerIndex}`}>{answer}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    ) as any;
  } catch {
    return null;
  }
}
