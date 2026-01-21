import type { TFunction } from "i18next";

import GuideFaqJsonLd from "@/components/seo/GuideFaqJsonLd";
import i18nApp from "@/i18n";
import type { GuideKey } from "@/routes.guides-helpers";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import { unifyNormalizedFaqEntries } from "@/utils/seo/jsonld";

interface FaqStructuredDataBlockProps {
  guideKey: GuideKey;
  hasLocalizedContent: boolean;
  suppressFaqWhenUnlocalized?: boolean;
  alwaysProvideFaqFallback?: boolean;
  guideFaqFallback?: React.ComponentProps<typeof GuideFaqJsonLd>["fallback"];
  preferManualWhenUnlocalized?: boolean;
  suppressUnlocalizedFallback?: boolean;
  // translators
  tGuides: (
    k: string,
    opts?: { returnObjects?: boolean } & Record<string, unknown>
  ) => unknown;
  hookI18n?: { getFixedT?: (lng: string, ns: string) => TFunction | undefined };
}

export default function FaqStructuredDataBlock({
  guideKey,
  hasLocalizedContent,
  suppressFaqWhenUnlocalized,
  alwaysProvideFaqFallback,
  guideFaqFallback,
  preferManualWhenUnlocalized,
  suppressUnlocalizedFallback,
  tGuides,
  hookI18n,
}: FaqStructuredDataBlockProps): JSX.Element | null {
  if (suppressFaqWhenUnlocalized && !hasLocalizedContent) return null;

  const shouldProvideFaqFallback = Boolean(
    // Honor explicit request to always expose a fallback builder
    alwaysProvideFaqFallback ||
      // Otherwise, only provide a builder when the page is unlocalized and
      // we can reasonably shape a fallback from EN resources. Prefer the
      // hook-provided i18n (mockable in tests); fall back to the app-level
      // i18n only when the hook does not expose getFixedT.
      (!preferManualWhenUnlocalized && !suppressUnlocalizedFallback && !hasLocalizedContent && (() => {
        try {
          const enGuidesHook = hookI18n?.getFixedT?.("en", "guides");
          const enFallbackHook = hookI18n?.getFixedT?.("en", "guidesFallback");
          const enGuidesApp = i18nApp?.getFixedT?.("en", "guides");
          const enFallbackApp = i18nApp?.getFixedT?.("en", "guidesFallback");
          const useHookOnly = typeof hookI18n?.getFixedT === "function";
          const candidates = (useHookOnly
            ? [enGuidesHook, enFallbackHook]
            : [enGuidesHook, enFallbackHook, enGuidesApp, enFallbackApp]
          ).filter((fn): fn is TFunction => typeof fn === "function");
          for (const en of candidates) {
            try {
              const faqsRaw = en(`content.${guideKey}.faqs`, { returnObjects: true });
              const faqsAltRaw = en(`content.${guideKey}.faq`, { returnObjects: true });
              const a = unifyNormalizedFaqEntries(faqsRaw);
              const b = unifyNormalizedFaqEntries(faqsAltRaw);
              if (a.length > 0 || b.length > 0) return true;
              const introRaw = en(`content.${guideKey}.intro`, { returnObjects: true });
              const introArr = Array.isArray(introRaw) ? ensureStringArray(introRaw) : [];
              if (introArr.length > 0) return true;
              const sectionsRaw = ensureArray<{ title?: unknown; body?: unknown; items?: unknown }>(
                en(`content.${guideKey}.sections`, { returnObjects: true }),
              );
              const hasSections = sectionsRaw.some((s) => {
                if (!s || typeof s !== "object") return false;
                const title = typeof s.title === "string" ? s.title.trim() : "";
                const body = ensureStringArray(
                  (s as { body?: unknown; items?: unknown }).body ??
                    (s as { body?: unknown; items?: unknown }).items,
                );
                return title.length > 0 || body.length > 0;
              });
              if (hasSections) return true;
            } catch {
              void 0;
            }
          }
          return false;
        } catch {
          void 0;
        }
      })())
  );

  const preferManualFallbackActive = Boolean(preferManualWhenUnlocalized && !hasLocalizedContent);
  const shouldExposeSanitizedFallback =
    preferManualFallbackActive || alwaysProvideFaqFallback || shouldProvideFaqFallback;

  const buildFallback = (langParam: string): NormalizedFaqEntry[] => {
    const pluralKey = `content.${guideKey}.faqs` as const;
    const singleKey = `content.${guideKey}.faq` as const;
    const fallbackPluralKeys = [pluralKey, `${guideKey}.faqs` as const];
    const fallbackSingleKeys = [singleKey, `${guideKey}.faq` as const];
    const collect = (translator: TFunction, key: string): NormalizedFaqEntry[] => {
      try {
        return unifyNormalizedFaqEntries(translator(key, { returnObjects: true }));
      } catch {
        return [];
      }
    };
    const collectFirstMatch = (
      translator: TFunction,
      keys: readonly string[],
    ): NormalizedFaqEntry[] => {
      for (const key of keys) {
        const entries = collect(translator, key);
        if (entries.length > 0) return entries;
      }
      return [];
    };

    const translatorMeta = tGuides as { __lang?: string };
    const currentLang = typeof translatorMeta?.__lang === "string" ? translatorMeta.__lang : undefined;
    const targetLang = typeof langParam === "string" && langParam.trim().length > 0 ? langParam : currentLang ?? "en";
    const targetLangLower = targetLang.toLowerCase();
    const currentLangLower = typeof currentLang === "string" ? currentLang.toLowerCase() : undefined;
    const preferHookOnly = typeof hookI18n?.getFixedT === "function";

    const gatherCandidates = (lang: string) => {
      const guides = new Set<TFunction>();
      const fallback = new Set<TFunction>();
      const register = (set: Set<TFunction>, candidate: unknown) => {
        if (typeof candidate === "function") {
          const fn = candidate as TFunction;
          if (!set.has(fn)) set.add(fn);
        }
      };

      const langLower = lang.toLowerCase();
      if (langLower === currentLangLower && typeof tGuides === "function") {
        register(guides, tGuides as unknown as TFunction);
        register(
          fallback,
          (hookI18n as { __tGuidesFallback?: TFunction } | undefined)?.__tGuidesFallback,
        );
      }

      register(guides, hookI18n?.getFixedT?.(lang, "guides"));
      register(fallback, hookI18n?.getFixedT?.(lang, "guidesFallback"));

      if (!preferHookOnly) {
        register(guides, i18nApp?.getFixedT?.(lang, "guides"));
        register(fallback, i18nApp?.getFixedT?.(lang, "guidesFallback"));
      }

      return {
        guides: Array.from(guides),
        fallback: Array.from(fallback),
      };
    };

    const tryGuidesTranslators = (lang: string): NormalizedFaqEntry[] => {
      const { guides } = gatherCandidates(lang);
      for (const translator of guides) {
        const plural = collect(translator, pluralKey);
        if (plural.length > 0) return plural;
        const single = collect(translator, singleKey);
        if (single.length > 0) return single;
      }
      return [];
    };

    const tryFallbackTranslators = (lang: string): NormalizedFaqEntry[] => {
      const { fallback } = gatherCandidates(lang);
      for (const translator of fallback) {
        const plural = collectFirstMatch(translator, fallbackPluralKeys);
        if (plural.length > 0) return plural;
        const single = collectFirstMatch(translator, fallbackSingleKeys);
        if (single.length > 0) return single;
      }
      return [];
    };

    const localized = tryGuidesTranslators(targetLang);
    if (localized.length > 0) {
      return localized;
    }

    if (typeof guideFaqFallback === "function") {
      try {
        const extra = unifyNormalizedFaqEntries(guideFaqFallback(targetLang));
        if (extra.length > 0) {
          return extra;
        }
      } catch {
        void 0;
      }
    }

    const structuredFallback = tryFallbackTranslators(targetLang);
    if (structuredFallback.length > 0) {
      return structuredFallback;
    }

    if (targetLangLower !== "en") {
      const english = tryGuidesTranslators("en");
      if (english.length > 0) {
        return english;
      }

      if (typeof guideFaqFallback === "function") {
        try {
          const extraEn = unifyNormalizedFaqEntries(guideFaqFallback("en"));
          if (extraEn.length > 0) {
            return extraEn;
          }
        } catch {
          void 0;
        }
      }

      const fallbackEn = tryFallbackTranslators("en");
      if (fallbackEn.length > 0) {
        return fallbackEn;
      }
    }

    return [];
  };

  // Only provide a fallback when explicitly requested via props. Always surface
  // route-provided fallback builders so tests can interrogate them even when
  // localized content exists. When both a route-level fallback and the
  // sanitized builder should be exposed, prefer the guide fallback and fall
  // back to the sanitized entries if it returns nothing.
  const fallbackProp = (() => {
    if (typeof guideFaqFallback === "function" && shouldExposeSanitizedFallback) {
      return (langParam: string) => {
        const manual = guideFaqFallback(langParam);
        if (Array.isArray(manual) && manual.length > 0) {
          return manual;
        }
        const sanitized = buildFallback(langParam);
        return sanitized.length > 0 ? sanitized : manual;
      };
    }
    if (typeof guideFaqFallback === "function") {
      return guideFaqFallback;
    }
    if (shouldExposeSanitizedFallback) {
      return buildFallback;
    }
    return undefined;
  })();

  if (!hasLocalizedContent && !fallbackProp && !preferManualFallbackActive) {
    return null;
  }

  return (
    <GuideFaqJsonLd
      guideKey={guideKey}
      {...(typeof fallbackProp === "function" ? { fallback: fallbackProp } : {})}
    />
  );
}
