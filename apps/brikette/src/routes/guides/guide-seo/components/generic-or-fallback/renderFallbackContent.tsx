import type { TFunction } from "i18next";

import { IS_DEV } from "@/config/env";
import { getContentAlias } from "@/config/guide-overrides";
import type { AppLanguage } from "@/i18n.config";
import { debugGuide } from "@/utils/debug";

import type { GuideSeoTemplateContext } from "../../types";
import type { StructuredFallback } from "../../utils/fallbacks";
import { renderAliasFaqsOnly } from "../fallback/renderAliasFaqsOnly";
import RenderFallbackStructured from "../fallback/RenderFallbackStructured";
import RenderInterrailAlias from "../fallback/RenderInterrailAlias";
import RenderManualObject from "../fallback/RenderManualObject";
import RenderManualParagraph from "../fallback/RenderManualParagraph";
import RenderManualString from "../fallback/RenderManualString";
import RenderStructuredArrays from "../fallback/RenderStructuredArrays";
import {
  allowsStructuredArraysWhenLocalized,
  hasManualFallbackMeaningfulContent,
  hasMeaningfulStructuredFallback,
  hasOnlyFaqs,
  resolveFallbackTranslator,
  translatorProvidesStructured,
} from "../generic";

type HookI18n = Parameters<typeof resolveFallbackTranslator>[1];
type FallbackTranslator = ReturnType<typeof resolveFallbackTranslator>;
type ManualHookI18n = Parameters<typeof RenderManualString>[0]["hookI18n"];

type GuidesTranslations = {
  tGuides: TFunction;
};

type RenderFallbackContentParams = {
  lang: AppLanguage;
  guideKey: GuideSeoTemplateContext["guideKey"];
  translations: GuidesTranslations;
  hookI18n: HookI18n;
  t: TFunction;
  context: GuideSeoTemplateContext;
  fallbackStructured: StructuredFallback | null;
  hasStructured: boolean;
  hasStructuredLocal: boolean;
  hasLocalizedContent: boolean;
  renderGenericContent: boolean;
  suppressUnlocalizedFallback?: boolean;
  preferManualWhenUnlocalized?: boolean;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  localizedManualFallback: unknown;
  manualStructuredFallbackRendered?: boolean;
};

function toManualHookI18n(hookI18n: HookI18n): ManualHookI18n {
  if (!hookI18n) return undefined;
  return {
    getFixedT: (lng: string, ns: string) => {
      try {
        const fixed = hookI18n.getFixedT?.(lng, ns);
        return typeof fixed === "function" ? fixed : undefined;
      } catch {
        return undefined;
      }
    },
  };
}

function safeDebugSkipped({
  guideKey,
  lang,
  hasStructured,
  hasLocalizedContent,
}: Pick<RenderFallbackContentParams, "guideKey" | "lang" | "hasStructured" | "hasLocalizedContent">) {
  try {
    debugGuide(
      "GenericContent skipped — rendering fallbacks", // i18n-exempt -- DEV-000 [ttl=2099-12-31] Debug label
      {
        guideKey,
        lang,
        hasStructured,
        hasLocalizedContent,
      },
    );
  } catch {
    /* noop */
  }
}

function resolveRawManualFallback({
  localizedManualFallback,
  translations,
  guideKey,
}: Pick<RenderFallbackContentParams, "localizedManualFallback" | "translations" | "guideKey">): Record<string, unknown> | null {
  if (localizedManualFallback && typeof localizedManualFallback === "object" && !Array.isArray(localizedManualFallback)) {
    return localizedManualFallback as Record<string, unknown>;
  }
  try {
    const raw = translations.tGuides(`content.${guideKey}.fallback`, { returnObjects: true }) as unknown;
    return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function shouldSuppressFallbackWhenManualIsEmpty({
  hasLocalizedContent,
  localizedManualFallback,
  translations,
  guideKey,
}: Pick<RenderFallbackContentParams, "hasLocalizedContent" | "localizedManualFallback" | "translations" | "guideKey">): boolean {
  if (hasLocalizedContent) return false;
  const rawManual = resolveRawManualFallback({ localizedManualFallback, translations, guideKey });
  if (!rawManual) return false;
  return !hasManualFallbackMeaningfulContent(rawManual);
}

function renderManualTextFallback({
  translations,
  hookI18n,
  guideKey,
  lang,
}: Pick<RenderFallbackContentParams, "translations" | "hookI18n" | "guideKey" | "lang">): JSX.Element | null {
  const manualStringEarly = RenderManualString({
    translations,
    hookI18n: toManualHookI18n(hookI18n),
    guideKey,
    lang,
  });
  if (manualStringEarly) return manualStringEarly;

  const manualParagraphEarly = RenderManualParagraph({
    translations,
    hookI18n: toManualHookI18n(hookI18n),
    guideKey,
    lang,
  });
  if (manualParagraphEarly) return manualParagraphEarly;

  return null;
}

function shouldSuppressDuplicateLocalizedStructured({
  fallbackStructured,
  hasLocalizedContent,
  context,
}: Pick<RenderFallbackContentParams, "fallbackStructured" | "hasLocalizedContent" | "context">): boolean {
  return Boolean(fallbackStructured && hasLocalizedContent && context.sections.length > 0);
}

function shouldSuppressStructuredArraysWhenLocalized({
  hasLocalizedContent,
  context,
  guideKey,
}: Pick<RenderFallbackContentParams, "hasLocalizedContent" | "context" | "guideKey">): boolean {
  if (!hasLocalizedContent) return false;
  try {
    const hasIntro = context.intro.length > 0;
    const hasSections = context.sections.some((s) => s.body.length > 0);
    return hasIntro && hasSections && !allowsStructuredArraysWhenLocalized(guideKey);
  } catch {
    return !allowsStructuredArraysWhenLocalized(guideKey);
  }
}

function renderInterrailAliasBlock({
  lang,
  guideKey,
  translations,
  t,
  showTocWhenUnlocalized,
  suppressTocTitle,
}: Pick<
  RenderFallbackContentParams,
  "lang" | "guideKey" | "translations" | "t" | "showTocWhenUnlocalized" | "suppressTocTitle"
>): JSX.Element | null {
  const aliasBlock = RenderInterrailAlias({
    lang,
    guideKey,
    translations,
    t,
    showTocWhenUnlocalized,
    ...(typeof suppressTocTitle === "boolean" ? { suppressTocTitle } : {}),
  });
  return aliasBlock ?? null;
}

function renderAliasFaqsOnlyBlock({
  context,
  hasStructuredLocal,
  translations,
  tFb,
  guideKey,
  t,
}: {
  context: GuideSeoTemplateContext;
  hasStructuredLocal: boolean;
  translations: GuidesTranslations;
  tFb: FallbackTranslator;
  guideKey: GuideSeoTemplateContext["guideKey"];
  t: TFunction;
}): JSX.Element | null {
  const guideAlias = getContentAlias(guideKey);
  if (!guideAlias) return null;
  return (
    renderAliasFaqsOnly({
      context,
      hasStructuredLocal,
      translations,
      tFb,
      guideKey,
      t,
      alias: guideAlias,
    }) ?? null
  );
}

function renderStructuredFallbackBlock(
  params: RenderFallbackContentParams & { tFb: FallbackTranslator },
): JSX.Element | null {
  const {
    fallbackStructured,
    suppressUnlocalizedFallback,
    preferManualWhenUnlocalized,
    renderGenericContent,
    manualStructuredFallbackRendered,
  } = params;
  if (!fallbackStructured) return null;
  if (suppressUnlocalizedFallback) return null;
  if (!(preferManualWhenUnlocalized || !renderGenericContent)) return null;
  if (manualStructuredFallbackRendered) return null;
  if (!hasMeaningfulStructuredFallback(fallbackStructured)) return null;

  return (
    <RenderFallbackStructured
      fallback={fallbackStructured}
      context={params.context}
      guideKey={params.guideKey}
      t={params.t}
      showTocWhenUnlocalized={params.showTocWhenUnlocalized}
      {...(typeof params.suppressTocTitle === "boolean" ? { suppressTocTitle: params.suppressTocTitle } : {})}
      {...(typeof params.preferManualWhenUnlocalized === "boolean"
        ? { preferManualWhenUnlocalized: params.preferManualWhenUnlocalized }
        : {})}
    />
  );
}

function renderManualObjectFallback(
  params: RenderFallbackContentParams & { tFb: FallbackTranslator },
): JSX.Element | null {
  const { hasLocalizedContent, suppressUnlocalizedFallback } = params;
  if (hasLocalizedContent || suppressUnlocalizedFallback) return null;

  const manualObject = RenderManualObject({
    translations: params.translations,
    hookI18n: toManualHookI18n(params.hookI18n),
    guideKey: params.guideKey,
    lang: params.lang,
    t: params.t,
    showTocWhenUnlocalized: params.showTocWhenUnlocalized,
    ...(typeof params.suppressTocTitle === "boolean" ? { suppressTocTitle: params.suppressTocTitle } : {}),
    fallbackTranslator: params.tFb,
  });
  if (!manualObject) return null;

  if (IS_DEV && process.env["DEBUG_TOC"] === "1") {
    console.info("[GenericOrFallbackContent:return:manualObject]");
  }

  return manualObject;
}

function renderStructuredArraysFallback(
  params: RenderFallbackContentParams & { tFb: FallbackTranslator },
): JSX.Element | null {
  const allowManualStructuredFallback = Boolean(params.preferManualWhenUnlocalized && !params.suppressUnlocalizedFallback);
  if (allowManualStructuredFallback) {
    try {
      if (hasOnlyFaqs(params.fallbackStructured, params.tFb, params.guideKey)) {
        return null;
      }
    } catch {
      /* noop */
    }
  }

  const shouldRenderStructuredFallback =
    (!params.hasLocalizedContent && !params.suppressUnlocalizedFallback) || allowManualStructuredFallback;
  if (!shouldRenderStructuredFallback) return null;

  return (
    RenderStructuredArrays({
      tFb: params.tFb,
      translations: params.translations,
      guideKey: params.guideKey,
      t: params.t,
      showTocWhenUnlocalized: params.showTocWhenUnlocalized,
      ...(typeof params.suppressTocTitle === "boolean" ? { suppressTocTitle: params.suppressTocTitle } : {}),
      context: params.context,
      ...(typeof params.preferManualWhenUnlocalized === "boolean"
        ? { preferManualWhenUnlocalized: params.preferManualWhenUnlocalized }
        : {}),
      ...(typeof params.manualStructuredFallbackRendered === "boolean"
        ? { manualStructuredFallbackRendered: params.manualStructuredFallbackRendered }
        : {}),
    }) ?? null
  );
}

function shouldSuppressForPreferManualFinalGuard({
  preferManualWhenUnlocalized,
  hasLocalizedContent,
  translations,
  tFb,
  guideKey,
}: Pick<RenderFallbackContentParams, "preferManualWhenUnlocalized" | "hasLocalizedContent" | "translations" | "guideKey"> & {
  tFb: FallbackTranslator;
}): boolean {
  if (!preferManualWhenUnlocalized || hasLocalizedContent) return false;
  return !translatorProvidesStructured(translations.tGuides, guideKey) && !translatorProvidesStructured(tFb, guideKey);
}

export function renderFallbackContent(params: RenderFallbackContentParams): JSX.Element | null {
  safeDebugSkipped(params);

  if (params.suppressUnlocalizedFallback && !params.hasLocalizedContent) {
    return null;
  }

  const manualTextEarly = renderManualTextFallback(params);
  if (manualTextEarly) return manualTextEarly;

  if (shouldSuppressFallbackWhenManualIsEmpty(params)) {
    return null;
  }

  const tFb = resolveFallbackTranslator(params.fallbackStructured, params.hookI18n, params.lang, params.translations);

  const aliasBlock = renderInterrailAliasBlock(params);
  if (aliasBlock) return aliasBlock;

  const aliasFaqsBlock = renderAliasFaqsOnlyBlock({
    context: params.context,
    hasStructuredLocal: params.hasStructuredLocal,
    translations: params.translations,
    tFb,
    guideKey: params.guideKey,
    t: params.t,
  });
  if (aliasFaqsBlock) return aliasFaqsBlock;

  if (shouldSuppressDuplicateLocalizedStructured(params)) {
    return null;
  }

  const structuredFallbackNode = renderStructuredFallbackBlock({ ...params, tFb });
  if (structuredFallbackNode) return structuredFallbackNode;

  const manualObjectNode = renderManualObjectFallback({ ...params, tFb });
  if (manualObjectNode) return manualObjectNode;

  if (shouldSuppressStructuredArraysWhenLocalized(params)) {
    return null;
  }

  const structuredArraysNode = renderStructuredArraysFallback({ ...params, tFb });
  if (structuredArraysNode) return structuredArraysNode;

  if (shouldSuppressForPreferManualFinalGuard({ ...params, tFb })) {
    return null;
  }

  return null;
}
