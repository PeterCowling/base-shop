import { type ComponentProps,memo } from "react";
import type { TFunction } from "i18next";

import GenericContent from "@/components/guides/GenericContent";
import {
  hasRuntimeContentFallback,
  shouldSkipEnTranslatorForFallback,
} from "@/config/guide-overrides";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";

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

type GenericContentProps = ComponentProps<typeof GenericContent>;
type GuidesTranslations = Parameters<typeof makeBaseGenericProps>[0]["translations"];
type HookI18n = Parameters<typeof makeBaseGenericProps>[0]["hookI18n"];

const MemoGenericContent = memo(GenericContent);
MemoGenericContent.displayName = "MemoGenericContent";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function createTranslatorWrapper(params: {
  guideKey: GuideSeoTemplateContext["guideKey"];
  lang: AppLanguage;
  hasLocalizedContent: boolean;
  englishFallbackAllowed: boolean;
  translations: GuidesTranslations;
  hookI18n: HookI18n;
  t: TFunction;
}): (props: unknown) => GenericContentProps {
  return (props: unknown) =>
    withTranslator(props, {
      guideKey: params.guideKey,
      lang: params.lang,
      hasLocalizedContent: params.hasLocalizedContent,
      englishFallbackAllowed: params.englishFallbackAllowed,
      translations: params.translations,
      hookI18n: params.hookI18n,
      t: params.t,
    }) as unknown as GenericContentProps;
}

function renderGenericOnceInternal(params: {
  hasLocalizedContent: boolean;
  preferManualWhenUnlocalized?: boolean;
  manualFallbackExists: boolean;
  renderWhenEmpty?: boolean;
  wrapWithTranslator: (props: unknown) => GenericContentProps;
  props: unknown;
}): JSX.Element | null {
  if (
    !params.hasLocalizedContent &&
    params.preferManualWhenUnlocalized &&
    !params.manualFallbackExists &&
    !params.renderWhenEmpty
  ) {
    return null;
  }
  return <MemoGenericContent {...params.wrapWithTranslator(params.props)} />;
}

function createPrepareProps(params: {
  articleDescriptionResolved?: string;
  context: GuideSeoTemplateContext;
  structuredTocItems?: TocItem[] | null | undefined;
}): (props: unknown) => unknown {
  return (props: unknown): unknown =>
    preparePropsForRender(
      props,
      params.articleDescriptionResolved,
      asRecord(params.context),
      params.structuredTocItems,
    );
}

function resolvePreferredGenericTranslator(params: {
  guideKey: GuideSeoTemplateContext["guideKey"];
  hookI18n: HookI18n;
  translations: GuidesTranslations;
}): TFunction {
  const { hookCandidate, appCandidate } = getEnTranslatorCandidates(params.hookI18n);
  return resolveEnglishTranslator({
    hookCandidate,
    appCandidate,
    fallback: params.translations.tGuides as unknown as TFunction,
    guideKey: params.guideKey,
  });
}

function renderPreferGenericWhenFallbackFastPath(params: {
  guideKey: GuideSeoTemplateContext["guideKey"];
  hasLocalizedContent: boolean;
  englishFallbackAllowed: boolean;
  hasStructuredLocal: boolean;
  hasStructuredEnEffective: boolean;
  preferGenericWhenFallback?: boolean;
  genericContentOptions?: { showToc?: boolean } | undefined;
  structuredTocItems?: TocItem[] | null | undefined;
  customTocProvided?: boolean;
  translations: GuidesTranslations;
  hookI18n: HookI18n;
  context: GuideSeoTemplateContext;
  prepareProps: (props: unknown) => unknown;
  renderGenericOnce: (props: unknown) => JSX.Element | null;
}): JSX.Element | null {
  const enabled =
    Boolean(params.preferGenericWhenFallback) &&
    !params.hasLocalizedContent &&
    params.englishFallbackAllowed &&
    params.hasStructuredEnEffective;
  if (!enabled) return null;

  try {
    const tEn = resolvePreferredGenericTranslator({
      guideKey: params.guideKey,
      hookI18n: params.hookI18n,
      translations: params.translations,
    });
    const base = { t: tEn, guideKey: params.guideKey } as const;
    let props: unknown = computeGenericContentProps({
      base,
      ...(typeof params.genericContentOptions !== "undefined" ? { genericContentOptions: params.genericContentOptions } : {}),
      structuredTocItems: params.structuredTocItems,
      ...(typeof params.customTocProvided === "boolean" ? { customTocProvided: params.customTocProvided } : {}),
      hasLocalizedContent: params.hasLocalizedContent,
    });
    props = applyIntroSuppression(props, params.hasStructuredLocal, asRecord(params.context));
    props = applySectionExtras(props, params.genericContentOptions);
    return params.renderGenericOnce(params.prepareProps(props));
  } catch {
    return null;
  }
}

function shouldSkipGenericContent(params: {
  englishFallbackAllowed: boolean;
  hasLocalizedContent: boolean;
  suppressUnlocalizedFallback?: boolean;
  preferManualWhenUnlocalized?: boolean;
  hasStructuredLocal: boolean;
  guideKey: GuideSeoTemplateContext["guideKey"];
  hasRuntimeStructured: boolean;
}): boolean {
  if (!params.englishFallbackAllowed && !params.hasLocalizedContent) return true;
  if (params.suppressUnlocalizedFallback && !params.hasLocalizedContent) return true;
  if (
    params.preferManualWhenUnlocalized &&
    !params.hasStructuredLocal &&
    !(hasRuntimeContentFallback(params.guideKey) && params.hasRuntimeStructured)
  ) {
    return true;
  }
  return false;
}

function shouldFallThroughToManual(params: {
  customTocProvided?: boolean;
  hasLocalizedContent: boolean;
  structuredTocItems?: TocItem[] | null | undefined;
  fallbackStructured: StructuredFallback | null;
  preferManualWhenUnlocalized?: boolean;
  guideKey: GuideSeoTemplateContext["guideKey"];
  hasRuntimeStructured: boolean;
  hasManualString: boolean;
  hasManualParagraph: boolean;
}): boolean {
  const hasManualTocItems = Array.isArray(params.structuredTocItems) && params.structuredTocItems.length > 0;
  if (params.customTocProvided && !params.hasLocalizedContent && hasManualTocItems && !params.fallbackStructured) {
    return true;
  }
  if (
    params.preferManualWhenUnlocalized &&
    !params.hasLocalizedContent &&
    !(hasRuntimeContentFallback(params.guideKey) && params.hasRuntimeStructured)
  ) {
    return true;
  }
  if (!params.hasLocalizedContent && (params.hasManualString || params.hasManualParagraph)) {
    return true;
  }
  return false;
}

function resolveStructuredFallbackSource(fallbackStructured: StructuredFallback | null): StructuredFallback["source"] | undefined {
  return fallbackStructured?.source;
}

function resolveGenericBaseProps(params: {
  guideKey: GuideSeoTemplateContext["guideKey"];
  t: TFunction;
  hasStructuredLocal: boolean;
  hasLocalizedContent: boolean;
  englishFallbackAllowed: boolean;
  renderWhenEmpty?: boolean;
  hookI18n: HookI18n;
  preferGenericWhenFallback?: boolean;
  translations: GuidesTranslations;
}): { t: TFunction; guideKey: string } {
  if (params.hasStructuredLocal) {
    return { t: params.t, guideKey: params.guideKey } as const;
  }

  if (!params.hasLocalizedContent && params.englishFallbackAllowed && Boolean(params.renderWhenEmpty)) {
    try {
      const fixedFromHook = params.hookI18n?.getFixedT?.("en", "guides");
      const fixedFromApp = i18n.getFixedT?.("en", "guides");
      const pick = (val: unknown): TFunction | undefined => (typeof val === "function" ? (val as TFunction) : undefined);
      const tEn = pick(fixedFromHook) ?? pick(fixedFromApp);
      if (tEn && !shouldSkipEnTranslatorForFallback(params.guideKey)) {
        return { t: tEn, guideKey: params.guideKey } as const;
      }
    } catch {
      /* noop */
    }
    return { t: params.t, guideKey: params.guideKey } as const;
  }

  return makeBaseGenericProps({
    hasLocalizedContent: params.hasLocalizedContent,
    ...(typeof params.preferGenericWhenFallback === "boolean" ? { preferGenericWhenFallback: params.preferGenericWhenFallback } : {}),
    translations: params.translations,
    hookI18n: params.hookI18n,
    guideKey: params.guideKey,
    allowEnglishFallback: params.englishFallbackAllowed,
  }) as unknown as { t: TFunction; guideKey: string };
}

function maybeMergeExactEnBase(params: {
  baseProps: { t: TFunction; guideKey: string };
  hasLocalizedContent: boolean;
  englishFallbackAllowed: boolean;
  preferGenericWhenFallback?: boolean;
  renderWhenEmpty?: boolean;
  guideKey: GuideSeoTemplateContext["guideKey"];
  hookI18n: HookI18n;
}): { t: TFunction; guideKey: string } {
  let base = params.baseProps;
  if (
    !params.hasLocalizedContent &&
    params.englishFallbackAllowed &&
    params.preferGenericWhenFallback &&
    !params.renderWhenEmpty &&
    !shouldSkipEnTranslatorForFallback(params.guideKey)
  ) {
    try {
      const fixedFromHook = params.hookI18n?.getFixedT?.("en", "guides");
      const fixedFromApp = i18n.getFixedT?.("en", "guides");
      const pick = (val: unknown): TFunction | undefined => (typeof val === "function" ? (val as TFunction) : undefined);
      const exactEn = pick(fixedFromHook) ?? pick(fixedFromApp);
      if (exactEn) base = { t: exactEn, guideKey: params.guideKey } as const;
    } catch {
      /* noop */
    }
  }
  return base;
}

function renderGenericContentWhenEmpty(params: {
  guideKey: GuideSeoTemplateContext["guideKey"];
  hasLocalizedContent: boolean;
  englishFallbackAllowed: boolean;
  preferGenericWhenFallback?: boolean;
  hasRuntimeStructured: boolean;
  translations: GuidesTranslations;
  hookI18n: HookI18n;
  genericContentOptions?: { showToc?: boolean } | undefined;
  structuredTocItems?: TocItem[] | null | undefined;
  customTocProvided?: boolean;
  hasStructuredLocal: boolean;
  context: GuideSeoTemplateContext;
  prepareProps: (props: unknown) => unknown;
  renderGenericOnce: (props: unknown) => JSX.Element | null;
}): JSX.Element | null {
  const allowViaRoute =
    allowsEmptyRender(params.guideKey) ||
    (hasRuntimeContentFallback(params.guideKey) && params.hasRuntimeStructured);
  const allowViaPreferGeneric = Boolean(params.preferGenericWhenFallback && !params.hasLocalizedContent);
  if (!allowViaRoute && !allowViaPreferGeneric) return null;

  const baseProps = makeBaseGenericProps({
    hasLocalizedContent: params.hasLocalizedContent,
    preferGenericWhenFallback: true,
    translations: params.translations,
    hookI18n: params.hookI18n,
    guideKey: params.guideKey,
    allowEnglishFallback: params.englishFallbackAllowed,
  });
  let props: unknown = computeGenericContentProps({
    base: baseProps,
    ...(typeof params.genericContentOptions !== "undefined" ? { genericContentOptions: params.genericContentOptions } : {}),
    structuredTocItems: params.structuredTocItems,
    ...(typeof params.customTocProvided === "boolean" ? { customTocProvided: params.customTocProvided } : {}),
    hasLocalizedContent: params.hasLocalizedContent,
  });
  if (params.hasStructuredLocal) {
    props = { ...(props as Record<string, unknown>), suppressIntro: true };
  }
  return params.renderGenericOnce(params.prepareProps(props));
}

function renderGenericContentMain(params: {
  guideKey: GuideSeoTemplateContext["guideKey"];
  t: TFunction;
  context: GuideSeoTemplateContext;
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
  translations: GuidesTranslations;
  hookI18n: HookI18n;
  prepareProps: (props: unknown) => unknown;
  renderGenericOnce: (props: unknown) => JSX.Element | null;
}): JSX.Element | null {
  if (!params.renderGenericContent) return null;

  const hasStructured = params.hasStructuredLocal || params.hasStructuredEnEffective;

  const preferGenericFastPath = renderPreferGenericWhenFallbackFastPath({
    guideKey: params.guideKey,
    hasLocalizedContent: params.hasLocalizedContent,
    englishFallbackAllowed: params.englishFallbackAllowed,
    hasStructuredLocal: params.hasStructuredLocal,
    hasStructuredEnEffective: params.hasStructuredEnEffective,
    preferGenericWhenFallback: params.preferGenericWhenFallback,
    genericContentOptions: params.genericContentOptions,
    structuredTocItems: params.structuredTocItems,
    customTocProvided: params.customTocProvided,
    translations: params.translations,
    hookI18n: params.hookI18n,
    context: params.context,
    prepareProps: params.prepareProps,
    renderGenericOnce: params.renderGenericOnce,
  });
  if (preferGenericFastPath) return preferGenericFastPath;

  if (
    shouldSkipGenericContent({
      englishFallbackAllowed: params.englishFallbackAllowed,
      hasLocalizedContent: params.hasLocalizedContent,
      suppressUnlocalizedFallback: params.suppressUnlocalizedFallback,
      preferManualWhenUnlocalized: params.preferManualWhenUnlocalized,
      hasStructuredLocal: params.hasStructuredLocal,
      guideKey: params.guideKey,
      hasRuntimeStructured: params.hasRuntimeStructured,
    })
  ) {
    return null;
  }

  const hasManualString = hasManualStringFallback(params.t, params.guideKey, params.hasLocalizedContent);
  const hasManualParagraph = hasManualParagraphFallback(params.t, params.guideKey, params.hasLocalizedContent);

  const structuredSource = resolveStructuredFallbackSource(params.fallbackStructured);
  const shouldRenderGeneric = decideShouldRenderGeneric({
    ...(typeof params.preferManualWhenUnlocalized === "boolean" ? { preferManualWhenUnlocalized: params.preferManualWhenUnlocalized } : {}),
    hasLocalizedContent: params.hasLocalizedContent,
    guideKey: params.guideKey,
    hasStructuredFallback: Boolean(params.fallbackStructured),
    ...(structuredSource === "guidesFallback" || structuredSource === "guidesEn" ? { structuredFallbackSource: structuredSource } : {}),
    ...(typeof params.preferGenericWhenFallback === "boolean" ? { preferGenericWhenFallback: params.preferGenericWhenFallback } : {}),
  });

  if (
    shouldFallThroughToManual({
      customTocProvided: params.customTocProvided,
      hasLocalizedContent: params.hasLocalizedContent,
      structuredTocItems: params.structuredTocItems,
      fallbackStructured: params.fallbackStructured,
      preferManualWhenUnlocalized: params.preferManualWhenUnlocalized,
      guideKey: params.guideKey,
      hasRuntimeStructured: params.hasRuntimeStructured,
      hasManualString,
      hasManualParagraph,
    })
  ) {
    return null;
  }

  return renderGenericContentAfterManualGate({
    ...params,
    hasStructured,
    shouldRenderGeneric,
  });
}

function renderGenericContentAfterManualGate(params: {
  guideKey: GuideSeoTemplateContext["guideKey"];
  t: TFunction;
  context: GuideSeoTemplateContext;
  renderWhenEmpty?: boolean;
  hasLocalizedContent: boolean;
  englishFallbackAllowed: boolean;
  hasStructuredLocal: boolean;
  hasStructuredEnEffective: boolean;
  hasRuntimeStructured: boolean;
  genericContentOptions?: { showToc?: boolean } | undefined;
  structuredTocItems?: TocItem[] | null | undefined;
  customTocProvided?: boolean;
  preferGenericWhenFallback?: boolean;
  translations: GuidesTranslations;
  hookI18n: HookI18n;
  prepareProps: (props: unknown) => unknown;
  renderGenericOnce: (props: unknown) => JSX.Element | null;
  hasStructured: boolean;
  shouldRenderGeneric: boolean;
}): JSX.Element | null {
  if (!params.hasStructured && !params.hasStructuredEnEffective && !params.renderWhenEmpty) {
    const emptyNode = renderGenericContentWhenEmpty({
      guideKey: params.guideKey,
      hasLocalizedContent: params.hasLocalizedContent,
      englishFallbackAllowed: params.englishFallbackAllowed,
      preferGenericWhenFallback: params.preferGenericWhenFallback,
      hasRuntimeStructured: params.hasRuntimeStructured,
      translations: params.translations,
      hookI18n: params.hookI18n,
      genericContentOptions: params.genericContentOptions,
      structuredTocItems: params.structuredTocItems,
      customTocProvided: params.customTocProvided,
      hasStructuredLocal: params.hasStructuredLocal,
      context: params.context,
      prepareProps: params.prepareProps,
      renderGenericOnce: params.renderGenericOnce,
    });
    return emptyNode ?? null;
  }

  if (!params.shouldRenderGeneric) return null;

  const baseProps = resolveGenericBaseProps({
    guideKey: params.guideKey,
    t: params.t,
    hasStructuredLocal: params.hasStructuredLocal,
    hasLocalizedContent: params.hasLocalizedContent,
    englishFallbackAllowed: params.englishFallbackAllowed,
    renderWhenEmpty: params.renderWhenEmpty,
    hookI18n: params.hookI18n,
    preferGenericWhenFallback: params.preferGenericWhenFallback,
    translations: params.translations,
  });
  const mergedBase = maybeMergeExactEnBase({
    baseProps,
    hasLocalizedContent: params.hasLocalizedContent,
    englishFallbackAllowed: params.englishFallbackAllowed,
    preferGenericWhenFallback: params.preferGenericWhenFallback,
    renderWhenEmpty: params.renderWhenEmpty,
    guideKey: params.guideKey,
    hookI18n: params.hookI18n,
  });

  let genericProps: unknown = computeGenericContentProps({
    base: mergedBase,
    ...(typeof params.genericContentOptions !== "undefined" ? { genericContentOptions: params.genericContentOptions } : {}),
    structuredTocItems: params.structuredTocItems,
    ...(typeof params.customTocProvided === "boolean" ? { customTocProvided: params.customTocProvided } : {}),
    hasLocalizedContent: params.hasLocalizedContent,
  });

  genericProps = applyIntroSuppression(genericProps, params.hasStructuredLocal, asRecord(params.context));
  genericProps = applySectionExtras(genericProps, params.genericContentOptions);

  if (!params.hasStructured && !params.renderWhenEmpty && !params.preferGenericWhenFallback) {
    return null;
  }

  if (needsLegacySecondArgInvocation(params.guideKey)) {
    try {
      const legacyInvoke = GenericContent as unknown as (props: unknown, legacyArg?: unknown) => unknown;
      void legacyInvoke(genericProps, params.t);
    } catch {
      /* noop */
    }
  }

  return params.renderGenericOnce(params.prepareProps(genericProps));
}

export function renderPrimaryContent(params: {
  lang: AppLanguage;
  guideKey: GuideSeoTemplateContext["guideKey"];
  translations: GuidesTranslations;
  hookI18n: HookI18n;
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

  const wrapWithTranslator = createTranslatorWrapper({
    guideKey,
    lang,
    hasLocalizedContent,
    englishFallbackAllowed,
    translations,
    hookI18n,
    t,
  });

  const renderGenericOnce = (props: unknown): JSX.Element | null =>
    renderGenericOnceInternal({
      hasLocalizedContent,
      preferManualWhenUnlocalized,
      manualFallbackExists,
      renderWhenEmpty,
      wrapWithTranslator,
      props,
    });

  const prepareProps = createPrepareProps({
    articleDescriptionResolved,
    context,
    structuredTocItems,
  });

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

  return renderGenericContentMain({
    guideKey,
    t,
    context,
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
    translations,
    hookI18n,
    prepareProps,
    renderGenericOnce,
  });
}
