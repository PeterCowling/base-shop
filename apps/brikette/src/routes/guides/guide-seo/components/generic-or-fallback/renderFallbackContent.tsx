import type { TFunction } from "i18next";

import { IS_DEV } from "@/config/env";
import { getContentAlias } from "@/config/guide-overrides";
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
} from "../generic";

export function renderFallbackContent(params: {
  lang: string;
  guideKey: string;
  translations: any;
  hookI18n: any;
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
}): JSX.Element | null {
  const {
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
  } = params;

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

      if (rawManual && typeof rawManual === "object" && !Array.isArray(rawManual)) {
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

  // Alias FAQs-only rendering (for guides with a contentAlias config)
  const guideAlias = getContentAlias(guideKey);
  if (guideAlias) {
    const aliasFaqsBlock = renderAliasFaqsOnly({
      context,
      hasStructuredLocal,
      translations,
      tFb,
      guideKey,
      t,
      alias: guideAlias,
    });
    if (aliasFaqsBlock) return aliasFaqsBlock;
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
      const toArr = (v: unknown): string[] => (Array.isArray(v)
        ? (v as unknown[])
            .map((x) => (typeof x === "string" ? x.trim() : String(x)))
            .filter((s) => s.length > 0)
        : []);
      const introLocal = toArr((translations as any)?.tGuides?.(`content.${guideKey}.intro`, { returnObjects: true }));
      const sectionsLocal = (() => {
        const raw = (translations as any)?.tGuides?.(`content.${guideKey}.sections`, { returnObjects: true });
        const list = Array.isArray(raw) ? (raw as unknown[]) : [];
        return list
          .map((s) => {
            if (!s || typeof s !== "object") return 0;
            const title = typeof (s as any).title === "string" ? (s as any).title.trim() : "";
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
            if (!s || typeof s !== "object") return 0;
            const title = typeof (s as any).title === "string" ? (s as any).title.trim() : "";
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
