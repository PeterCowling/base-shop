// src/routes/guides/guide-seo/components/GenericOrFallbackContent.tsx
/* eslint-disable @typescript-eslint/no-explicit-any, ds/no-hardcoded-copy -- DEV-000: Extracted from _GuideSeoTemplate for test parity. */
import { useMemo } from "react";
import type { TFunction } from "i18next";

import type { AppLanguage } from "@/i18n.config";
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

function resolveArticleDescriptionResolved(params: {
  articleDescription?: string;
  context: GuideSeoTemplateContext;
}): string | undefined {
  if (typeof params.articleDescription === "string") return params.articleDescription;
  try {
    const descRaw = (params.context as any)?.article?.description;
    return typeof descRaw === "string" ? (descRaw as string) : undefined;
  } catch {
    return undefined;
  }
}

function safeDebugManualFallback(params: {
  guideKey: string;
  lang: string;
  hasLocalizedContent: boolean;
  localizedManualFallback: unknown;
}) {
  try {
    debugGuide("GenericContent localized manual fallback", {
      guideKey: params.guideKey,
      lang: params.lang,
      hasLocalizedContent: params.hasLocalizedContent,
      manualFallbackType: params.localizedManualFallback == null ? null : typeof params.localizedManualFallback,
    });
  } catch {
    /* noop */
  }
}

function shouldSkipByGuidePolicies(params: {
  guideKey: string;
  hasLocalizedContent: boolean;
  hasStructuredLocal: boolean;
  hasStructuredEnEffective: boolean;
}): boolean {
  if (shouldSkipWhenPureEmpty(params.guideKey)) {
    if (!params.hasLocalizedContent && !params.hasStructuredLocal && !params.hasStructuredEnEffective) {
      return true;
    }
  }
  if (shouldSkipFallbacksWhenUnlocalized(params.guideKey) && !params.hasLocalizedContent) {
    return true;
  }
  return false;
}

function shouldSuppressManualDueToMalformedFallback(params: { translations: any; guideKey: string }): boolean {
  try {
    const kProbe = `content.${params.guideKey}.fallback` as const;
    const raw = params.translations?.tGuides?.(kProbe, { returnObjects: true }) as unknown;
    if (raw == null) return false;
    if (typeof raw === "object" && !Array.isArray(raw)) return false;
    if (Array.isArray(raw)) return raw.length > 0;
    return true;
  } catch {
    return false;
  }
}

function resolveManualFallbackRaw(params: {
  englishFallbackAllowed: boolean;
  preferManualWhenUnlocalized?: boolean;
  guideKey: string;
  translations: any;
  hookI18n: any;
  localizedManualFallback: unknown;
}): { localManualRaw: unknown; enManualRaw: unknown } {
  const kManual = `content.${params.guideKey}.fallback` as const;
  const localManualRaw =
    params.localizedManualFallback && typeof params.localizedManualFallback === "object" && !Array.isArray(params.localizedManualFallback)
      ? params.localizedManualFallback
      : (params.translations?.tGuides?.(kManual, { returnObjects: true }) as unknown);

  const allowEnglishManual = params.englishFallbackAllowed && !params.preferManualWhenUnlocalized;
  const enManualRaw = allowEnglishManual
    ? (() => {
        try {
          const fixed = params.hookI18n?.getFixedT?.("en", "guides");
          if (typeof fixed === "function") return fixed(kManual, { returnObjects: true }) as unknown;
        } catch {
          /* noop */
        }
        return undefined;
      })()
    : undefined;

  return { localManualRaw, enManualRaw };
}

function computeManualFallbackFlags(params: { localManualRaw: unknown; enManualRaw: unknown }): {
  manualLocalMeaningful: boolean;
  manualEnMeaningful: boolean;
  shouldRenderManual: boolean;
} {
  const manualLocalMeaningful = manualFallbackHasMeaningfulContent(params.localManualRaw);
  const manualEnMeaningful = manualFallbackHasMeaningfulContent(params.enManualRaw);
  const shouldRenderManual = manualLocalMeaningful || manualEnMeaningful;
  return { manualLocalMeaningful, manualEnMeaningful, shouldRenderManual };
}

function renderManualObjectNode(params: {
  translations: any;
  hookI18n: any;
  guideKey: string;
  lang: string;
  t: TFunction;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
}): JSX.Element | null {
  return RenderManualObject({
    translations: params.translations,
    hookI18n: params.hookI18n,
    guideKey: params.guideKey as any,
    lang: params.lang as any,
    t: params.t as any,
    showTocWhenUnlocalized: params.showTocWhenUnlocalized,
    ...(typeof params.suppressTocTitle === "boolean" ? { suppressTocTitle: params.suppressTocTitle } : {}),
  }) as any;
}

function maybeRenderManualFallback(params: {
  hasLocalizedContent: boolean;
  preferGenericWhenFallback?: boolean;
  suppressUnlocalizedFallback?: boolean;
  englishFallbackAllowed: boolean;
  preferManualWhenUnlocalized?: boolean;
  guideKey: string;
  lang: string;
  translations: any;
  hookI18n: any;
  t: TFunction;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  localizedManualFallback: unknown;
}): { node: JSX.Element | null; manualFallbackExists: boolean; manualLocalMeaningful: boolean; manualEnMeaningful: boolean } {
  if (params.hasLocalizedContent) {
    return { node: null, manualFallbackExists: false, manualLocalMeaningful: false, manualEnMeaningful: false };
  }
  if (params.preferGenericWhenFallback || params.suppressUnlocalizedFallback) {
    return { node: null, manualFallbackExists: false, manualLocalMeaningful: false, manualEnMeaningful: false };
  }

  if (shouldSuppressManualDueToMalformedFallback({ translations: params.translations, guideKey: params.guideKey })) {
    return { node: null, manualFallbackExists: false, manualLocalMeaningful: false, manualEnMeaningful: false };
  }

  const { localManualRaw, enManualRaw } = resolveManualFallbackRaw({
    englishFallbackAllowed: params.englishFallbackAllowed,
    preferManualWhenUnlocalized: params.preferManualWhenUnlocalized,
    guideKey: params.guideKey,
    translations: params.translations,
    hookI18n: params.hookI18n,
    localizedManualFallback: params.localizedManualFallback,
  });

  const { manualLocalMeaningful, manualEnMeaningful, shouldRenderManual } = computeManualFallbackFlags({
    localManualRaw,
    enManualRaw,
  });

  if (!shouldRenderManual) {
    return { node: null, manualFallbackExists: manualLocalMeaningful, manualLocalMeaningful, manualEnMeaningful };
  }

  const node = renderManualObjectNode({
    translations: params.translations,
    hookI18n: params.hookI18n,
    guideKey: params.guideKey,
    lang: params.lang,
    t: params.t,
    showTocWhenUnlocalized: params.showTocWhenUnlocalized,
    suppressTocTitle: params.suppressTocTitle,
  });

  return {
    node,
    manualFallbackExists: Boolean(node) || manualLocalMeaningful,
    manualLocalMeaningful,
    manualEnMeaningful,
  };
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
  const articleDescriptionResolved = resolveArticleDescriptionResolved({ articleDescription, context });

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

  safeDebugManualFallback({ guideKey, lang, hasLocalizedContent, localizedManualFallback });

  if (
    shouldSkipByGuidePolicies({
      guideKey,
      hasLocalizedContent,
      hasStructuredLocal,
      hasStructuredEnEffective,
    })
  ) {
    return null;
  }

  const { node: manualNode, manualFallbackExists } = maybeRenderManualFallback({
    hasLocalizedContent,
    preferGenericWhenFallback,
    suppressUnlocalizedFallback,
    englishFallbackAllowed,
    preferManualWhenUnlocalized,
    guideKey,
    lang,
    translations,
    hookI18n,
    t,
    showTocWhenUnlocalized,
    suppressTocTitle,
    localizedManualFallback,
  });
  if (manualNode) return manualNode;

  // Skip GenericContent when route prefers manual and suppresses fallbacks
  if (
    !hasExplicitLocalizedForTarget &&
    preferManualWhenUnlocalized &&
    suppressUnlocalizedFallback &&
    !renderWhenEmpty
  ) {
    return null;
  }

  const hasStructured = hasStructuredLocal || hasStructuredEnEffective;

  const primaryNode = renderPrimaryContent({
    lang: lang as AppLanguage,
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
    lang: lang as AppLanguage,
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
