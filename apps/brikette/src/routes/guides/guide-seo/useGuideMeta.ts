import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import i18n from "@/i18n";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { debugGuide } from "@/utils/debug";
import { DEFAULT_TWITTER_CARD } from "@/utils/headConstants";

import type { GuideTranslationSuite } from "./translations";
import { translateStringWithFallback } from "./translations";

type HookI18n = { getFixedT?: (lng: string, ns?: string) => TFunction };

function useGuidesI18n(): HookI18n | undefined {
  try {
    const translation = useTranslation("guides", { useSuspense: false }) as unknown as { i18n?: HookI18n };
    return translation?.i18n;
  } catch {
    void 0;
    return undefined;
  }
}

interface GuideMetaArgs extends GuideTranslationSuite {
  metaKey: string;
  twitterCardKey: string;
  twitterCardDefault?: string;
  /** Treat translator-provided structured arrays as localized and suppress EN fallbacks */
  hasLocalizedContent?: boolean;
  /** Optional i18n instance from useGuideTranslations for reliable getFixedT access in tests */
  i18n?: { getFixedT?: (lng: string, ns?: string) => TFunction };
  /** When true and no localized content exists, suppress English string fallbacks. */
  suppressUnlocalizedFallback?: boolean;
  /**
   * Allow English fallback strings even when suppressUnlocalizedFallback=true. This is used
   * by manual fallback routes so article metadata (title/description) remains populated when
   * there is no localized structured content.
   */
  allowEnglishFallbackWhenManual?: boolean;
}

export interface GuideMetaResult {
  title: string;
  description: string;
  twitterCardType: string;
  homeLabel: string;
  guidesLabel: string;
}

export function useGuideMeta({
  metaKey,
  twitterCardDefault,
  twitterCardKey: _twitterCardKey,
  tGuides,
  guidesEn,
  tAny,
  anyEn: _anyEn,
  tHeader,
  headerEn: _headerEn,
  tCommon: _tCommon,
  commonEn: _commonEn,
  lang,
  hasLocalizedContent,
  i18n: hookFromTranslations,
  suppressUnlocalizedFallback,
  allowEnglishFallbackWhenManual,
}: GuideMetaArgs): GuideMetaResult {
  // Access the i18n instance from react-i18next hook once (stable across memo calls).
  // Use an explicit namespace to avoid tests that throw on undefined namespaces
  // or return undefined from the hook mock. Guard access defensively.
  const guidesI18n = useGuidesI18n();
  const hookI18n: HookI18n | undefined = hookFromTranslations ?? guidesI18n;

  const englishHomeResource = (() => {
    try {
      return getGuideResource<unknown>("en", "labels.homeBreadcrumb", { includeFallback: false });
    } catch {
      return undefined;
    }
  })();
  const englishGuidesResource = (() => {
    try {
      return getGuideResource<unknown>("en", "labels.guidesBreadcrumb", { includeFallback: false });
    } catch {
      return undefined;
    }
  })();
  const englishHomeTranslatorValue = (() => {
    try {
      return guidesEn("labels.homeBreadcrumb") as unknown;
    } catch {
      return undefined;
    }
  })();
  const englishGuidesTranslatorValue = (() => {
    try {
      return guidesEn("labels.guidesBreadcrumb") as unknown;
    } catch {
      return undefined;
    }
  })();
  const homeLabelCache = useRef<{ lang: string; value: string } | null>(null);
  const guidesLabelCache = useRef<{ lang: string; value: string } | null>(null);
  const allowEnglishFallback = Boolean(
    hasLocalizedContent || !suppressUnlocalizedFallback || allowEnglishFallbackWhenManual,
  );
  const title = useMemo(() => {
    const explicitMetaKey = `meta.${metaKey}.title` as const;
    const sanitize = (value: unknown, expectedKey: string): string | null => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (trimmed.length === 0) return null;
      if (trimmed === expectedKey) return null;
      const lower = trimmed.toLowerCase();
      if (lower === metaKey.toLowerCase()) return null;
      if (lower.includes("meta")) return null;
      return trimmed;
    };
    const englishMetaValue = lang === "en"
      ? undefined
      : (() => {
          try {
            const candidate = guidesEn(explicitMetaKey) as unknown;
            return typeof candidate === "string" ? candidate.trim() : undefined;
          } catch {
            return undefined;
          }
        })();

    const localMetaRaw = tGuides(explicitMetaKey) as unknown;
    const localMeta = (() => {
      const candidate = sanitize(localMetaRaw, explicitMetaKey);
      if (!candidate) return null;
      if (englishMetaValue && candidate === englishMetaValue) return null;
      return candidate;
    })();
    if (localMeta) return localMeta;

    const contentKey = `content.${metaKey}.seo.title` as const;
    const localContent = sanitize(tGuides(contentKey) as unknown, contentKey);
    if (localContent) return localContent;

    const viaT = translateStringWithFallback(tGuides, guidesEn, contentKey, undefined, { locale: lang });
    const fallbackTitle = sanitize(viaT, contentKey);
    if (fallbackTitle) return fallbackTitle;

    const englishMetaFallback = sanitize(englishMetaValue, explicitMetaKey);
    if (englishMetaFallback) return englishMetaFallback;

    return contentKey;
  }, [guidesEn, lang, metaKey, tGuides]);

  const description = useMemo(() => {
    // Prefer explicit meta.description when provided by the active locale;
    const explicitMetaKey = `meta.${metaKey}.description` as const;
    const localMetaRaw = tGuides(explicitMetaKey) as unknown;
    const localMetaMeaningful =
      typeof localMetaRaw === "string" &&
      localMetaRaw.trim().length > 0 &&
      localMetaRaw.trim() !== explicitMetaKey;
    if (localMetaMeaningful) return (localMetaRaw as string).trim();

    const k = `content.${metaKey}.seo.description` as const;
    const localOnly = tGuides(k) as unknown;
    if (typeof localOnly === "string") {
      const localDesc = localOnly.trim();
      if (localDesc.length > 0 && localDesc !== k) {
        // Guard against placeholder strings where a locale mistakenly copies
        // the EN title into description. If so, ignore and fall back to EN
        // description instead.
        try {
          const enTitle = translateStringWithFallback(
            tGuides,
            guidesEn,
            `content.${metaKey}.seo.title`,
            undefined,
            { locale: lang },
          );
          if (typeof enTitle === "string" && enTitle.trim().length > 0 && localDesc === enTitle.trim()) {
            // Locale description matches EN title → ignore and prefer EN description directly
            try {
              const enDescRaw = guidesEn(k) as unknown;
              if (typeof enDescRaw === "string") {
                const enDesc = enDescRaw.trim();
                if (enDesc.length > 0 && enDesc !== k) return enDesc;
              }
            } catch {
              /* fall back to generic EN handling below */
            }
            // If we couldn't resolve EN description directly, fall through to generic EN fallback below
          } else {
            // Locale description is meaningful and not a placeholder; accept it
            return localDesc;
          }
        } catch {
          return localDesc;
        }
      }
    }

    // On blank/unresolved locale values, allow EN fallback regardless of structured content
    if (allowEnglishFallback) {
      const viaT = translateStringWithFallback(tGuides, guidesEn, k, undefined, { locale: lang });
      if (typeof viaT === "string" && viaT.trim().length > 0 && viaT !== k) return viaT;
    }

    // Final fallback for description: empty string when unresolved/placeholder
    return "";
  }, [allowEnglishFallback, guidesEn, lang, metaKey, tGuides]);

  const twitterCardType = useMemo(
    () => twitterCardDefault ?? DEFAULT_TWITTER_CARD,
    [twitterCardDefault],
  );

  const computedHomeLabel = useMemo(() => {
    const primaryKey = "labels.homeBreadcrumb" as const;
    const altKey = "breadcrumbs.home" as const;

    const englishHeaderNamespaceHook = (() => {
      try {
        return hookI18n?.getFixedT?.("en", "header")?.("home");
      } catch {
        return undefined;
      }
    })();
    const englishHeaderNamespaceApp = (() => {
      try {
        return i18n.getFixedT?.("en", "header")?.("home");
      } catch {
        return undefined;
      }
    })();
    const englishHeaderKeyHook = (() => {
      try {
        return hookI18n?.getFixedT?.("en")?.("header:home");
      } catch {
        return undefined;
      }
    })();
    const englishHeaderKeyApp = (() => {
      try {
        return i18n.getFixedT?.("en")?.("header:home");
      } catch {
        return undefined;
      }
    })();

    const englishFallbacks = (() => {
      const values = new Set<string>(["home", "header:home"]);
      const register = (candidate: unknown) => {
        if (typeof candidate !== "string") return;
        const trimmed = candidate.trim();
        if (trimmed.length === 0) return;
        values.add(trimmed.toLowerCase());
      };

      register(englishHomeResource);
      register(englishHomeTranslatorValue);
      register(englishHeaderNamespaceHook);
      register(englishHeaderNamespaceApp);
      register(englishHeaderKeyHook);
      register(englishHeaderKeyApp);

      return values;
    })();

    const englishPlaceholderSentinels = new Set<string>([
      primaryKey.toLowerCase(),
      altKey.toLowerCase(),
      "home",
      "header:home",
    ]);
    const englishFallbackHasMeaningful = (
      [
        englishHomeResource,
        englishHomeTranslatorValue,
        englishHeaderNamespaceHook,
        englishHeaderNamespaceApp,
        englishHeaderKeyHook,
        englishHeaderKeyApp,
      ] as const
    ).some((value) => {
      if (typeof value !== "string") return false;
      const trimmed = value.trim();
      if (trimmed.length === 0) return false;
      if (trimmed.startsWith("［Stub］")) return false;
      const normalized = trimmed.toLowerCase();
      if (englishPlaceholderSentinels.has(normalized)) return false;
      return true;
    });

    const englishTranslatorMeaningful =
      typeof englishHomeTranslatorValue === "string" &&
      (() => {
        const trimmed = englishHomeTranslatorValue.trim();
        if (trimmed.length === 0) return false;
        if (trimmed.startsWith("［Stub］")) return false;
        const normalized = trimmed.toLowerCase();
        if (normalized === primaryKey.toLowerCase()) return false;
        if (normalized === altKey.toLowerCase()) return false;
        if (normalized === "header:home") return false;
        return true;
      })();
    const allowEnglishFallback = lang === "en" || englishTranslatorMeaningful || englishFallbackHasMeaningful;

    const toCandidate = (value: unknown, placeholder: string, disallowed: string[] = []): string | null => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (trimmed.length === 0) return null;
      if (trimmed === placeholder) return null;
      if (trimmed.startsWith("［Stub］")) return null;
      if (disallowed.some((entry) => trimmed.toLowerCase() === entry.toLowerCase())) return null;
      if (!allowEnglishFallback && englishFallbacks.has(trimmed.toLowerCase())) return null;
      return trimmed;
    };

    const primaryRaw = tGuides(primaryKey) as unknown;
    const primaryCandidate = toCandidate(primaryRaw, primaryKey);
    if (primaryCandidate !== null) return primaryCandidate;

    const altRaw = tGuides(altKey) as unknown;
    const altCandidate = toCandidate(altRaw, altKey);
    if (altCandidate !== null) return altCandidate;

    const englishTranslatorMissing = typeof englishHomeTranslatorValue !== "string";
    const englishResourceBlank = typeof englishHomeResource === "string" && englishHomeResource.trim().length === 0;
    if (englishTranslatorMissing && englishResourceBlank) return primaryKey;

    const headerRaw = tHeader("home") as unknown;
    const headerCandidate = toCandidate(headerRaw, "home", ["header:home"]);
    if (headerCandidate !== null) return headerCandidate;
    if (typeof headerRaw === "string" && headerRaw.trim().length === 0) return "";

    const genericRaw = tAny("header:home") as unknown;
    const genericCandidate = toCandidate(genericRaw, "header:home", ["home"]);
    if (genericCandidate !== null) return genericCandidate;
    if (typeof genericRaw === "string" && genericRaw.trim().length === 0) return "";

    const localeProvidedPlaceholder =
      (typeof primaryRaw === "string" && primaryRaw.trim() === primaryKey) ||
      (typeof altRaw === "string" && altRaw.trim() === altKey) ||
      (typeof headerRaw === "string" && headerRaw.trim() === "home") ||
      (typeof genericRaw === "string" && genericRaw.trim() === "header:home");
    const hasLocaleCandidate = [
      toCandidate(primaryRaw, primaryKey),
      toCandidate(altRaw, altKey),
      toCandidate(headerRaw, "home", ["header:home"]),
      toCandidate(genericRaw, "header:home", ["home"]),
    ].some((candidate): candidate is string => typeof candidate === "string" && candidate.length > 0);
    if (!hasLocaleCandidate && localeProvidedPlaceholder && !allowEnglishFallback) {
      return primaryKey;
    }

    const englishCandidates: string[] = [];
    const registerCandidate = (value: unknown) => {
      if (typeof value === "string") englishCandidates.push(value);
    };
    // Prefer translator overrides from the active i18n instance so tests that
    // stub EN copy (for example, "Home EN") take precedence over the static
    // resource bundle.
    registerCandidate(englishHomeTranslatorValue);
    registerCandidate(englishHomeResource);
    registerCandidate(englishHeaderNamespaceHook);
    registerCandidate(englishHeaderNamespaceApp);
    registerCandidate(englishHeaderKeyHook);
    registerCandidate(englishHeaderKeyApp);

    for (const candidate of englishCandidates) {
      if (candidate === primaryKey) continue;
      const trimmed = candidate.trim();
      if (trimmed.length === 0) return "";
      if (trimmed.startsWith("［Stub］")) continue;
      const normalized = trimmed.toLowerCase();
      if (!allowEnglishFallback && englishFallbacks.has(normalized)) continue;
      if (normalized === "header:home") continue;
      if (normalized === "home") {
        if (allowEnglishFallback && trimmed === "Home") return trimmed;
        continue;
      }
      if (trimmed.length > 0 && (allowEnglishFallback || !englishFallbacks.has(normalized))) {
        return trimmed;
      }
    }

    return primaryKey;
  }, [englishHomeResource, englishHomeTranslatorValue, hookI18n, lang, tAny, tGuides, tHeader]);

  if (!homeLabelCache.current || homeLabelCache.current.lang !== lang) {
    homeLabelCache.current = { lang, value: computedHomeLabel };
  } else if (homeLabelCache.current.value !== "labels.homeBreadcrumb") {
    homeLabelCache.current = { lang, value: computedHomeLabel };
  }
  const homeLabel = homeLabelCache.current?.value ?? computedHomeLabel;

  const computedGuidesLabel = useMemo(() => {
    const primaryKey = "labels.guidesBreadcrumb" as const;
    const altKey = "breadcrumbs.guides" as const;
    const indexKey = "labels.indexTitle" as const;
    const metaIndexKey = "meta.index.title" as const;
    const nsKey = "guides:labels.indexTitle" as const;

    const englishFallbacks = (() => {
      const values = new Set<string>(["guides"]);
      const register = (candidate: unknown) => {
        if (typeof candidate !== "string") return;
        const trimmed = candidate.trim();
        if (trimmed.length === 0) return;
        values.add(trimmed.toLowerCase());
      };

      register(englishGuidesResource);
      register(englishGuidesTranslatorValue);
      try {
        register(guidesEn(altKey) as unknown);
      } catch {
        /* ignore missing English alt translation */
      }
      try {
        register(guidesEn(indexKey) as unknown);
      } catch {
        /* ignore missing English index translation */
      }
      try {
        register(guidesEn(metaIndexKey) as unknown);
      } catch {
        /* ignore missing English meta index translation */
      }
      try {
        register(guidesEn(nsKey) as unknown);
      } catch {
        /* ignore missing English namespace translation */
      }
      try {
        register(hookI18n?.getFixedT?.("en", "guides")?.(metaIndexKey));
      } catch {
        /* ignore runtime English meta translation */
      }
      try {
        register(i18n.getFixedT?.("en", "guides")?.(metaIndexKey));
      } catch {
        /* ignore runtime English meta translation */
      }

      return values;
    })();

    const englishTranslatorMeaningful =
      typeof englishGuidesTranslatorValue === "string" &&
      (() => {
        const trimmed = englishGuidesTranslatorValue.trim();
        if (trimmed.length === 0) return false;
        if (trimmed.startsWith("［Stub］")) return false;
        const normalized = trimmed.toLowerCase();
        if (normalized === primaryKey.toLowerCase()) return false;
        if (normalized === altKey.toLowerCase()) return false;
        if (normalized === indexKey.toLowerCase()) return false;
        if (normalized === metaIndexKey.toLowerCase()) return false;
        if (normalized === nsKey.toLowerCase()) return false;
        return true;
      })();
    const allowEnglishFallback = lang === "en" || englishTranslatorMeaningful;

    const toCandidate = (value: unknown, placeholder: string, disallowed: string[] = []): string | null => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (trimmed.length === 0) return null;
      if (trimmed === placeholder || trimmed === primaryKey || trimmed.startsWith("［Stub］")) return null;
      if (disallowed.some((entry) => trimmed.toLowerCase() === entry.toLowerCase())) return null;
      if (!allowEnglishFallback && englishFallbacks.has(trimmed.toLowerCase())) return null;
      return trimmed;
    };

    const localizedKeys: Array<[unknown, string]> = [
      [tGuides(primaryKey) as unknown, primaryKey],
      [tGuides(altKey) as unknown, altKey],
      [tGuides(indexKey) as unknown, indexKey],
      [tGuides(metaIndexKey) as unknown, metaIndexKey],
      [tGuides(nsKey) as unknown, nsKey],
    ];

    for (const [raw, placeholder] of localizedKeys) {
      const disallowed = placeholder === primaryKey && !allowEnglishFallback ? ["Guides"] : [];
      const candidate = toCandidate(raw, placeholder, disallowed);
      if (candidate !== null) return candidate;
    }

    const englishTranslatorMissing = typeof englishGuidesTranslatorValue !== "string";
    const englishResourceBlank = typeof englishGuidesResource === "string" && englishGuidesResource.trim().length === 0;
    if (englishTranslatorMissing && englishResourceBlank) return primaryKey;
    const englishCandidates: string[] = [];
    if (typeof englishGuidesTranslatorValue === "string") englishCandidates.push(englishGuidesTranslatorValue as string);
    if (typeof englishGuidesResource === "string") englishCandidates.push(englishGuidesResource as string);
    try {
      const val = guidesEn(altKey) as unknown;
      if (typeof val === "string") englishCandidates.push(val);
    } catch {
      void 0;
    }
    try {
      const val = guidesEn(indexKey) as unknown;
      if (typeof val === "string") englishCandidates.push(val);
    } catch {
      void 0;
    }
    try {
      const val = hookI18n?.getFixedT?.("en", "guides")?.(metaIndexKey);
      if (typeof val === "string") englishCandidates.push(val);
    } catch {
      void 0;
    }
    try {
      const val = i18n.getFixedT?.("en", "guides")?.(metaIndexKey);
      if (typeof val === "string") englishCandidates.push(val);
    } catch {
      void 0;
    }

    for (const candidate of englishCandidates) {
      if (candidate === primaryKey) continue;
      const trimmed = candidate.trim();
      if (trimmed.length === 0) return "";
      if (
        trimmed.length > 0 &&
        trimmed !== altKey &&
        trimmed !== indexKey &&
        !trimmed.startsWith("［Stub］") &&
        (allowEnglishFallback || !englishFallbacks.has(trimmed.toLowerCase()))
      ) {
        return trimmed;
      }
    }

    return primaryKey;
  }, [englishGuidesResource, englishGuidesTranslatorValue, guidesEn, hookI18n, lang, tGuides]);

  if (!guidesLabelCache.current || guidesLabelCache.current.lang !== lang) {
    guidesLabelCache.current = { lang, value: computedGuidesLabel };
  } else if (guidesLabelCache.current.value !== "labels.guidesBreadcrumb") {
    guidesLabelCache.current = { lang, value: computedGuidesLabel };
  }
  const guidesLabel = guidesLabelCache.current?.value ?? computedGuidesLabel;

  try {
    debugGuide({
      context: "guides.useGuideMeta.labels",
      lang,
      hasLocalizedContent,
      homeLabel,
      guidesLabel,
      englishHomeResource,
      englishGuidesResource,
      englishHomeTranslatorValue,
      englishGuidesTranslatorValue,
    });
  } catch {
    // no-op for test environments without console
  }

  // Structured debug payload only; avoid hardcoded copy to satisfy lint rules

  return {
    title,
    description,
    twitterCardType,
    homeLabel,
    guidesLabel,
  };
}
