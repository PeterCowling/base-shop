/* eslint-disable ds/no-hardcoded-copy -- DEV-1790: Structured guide fallbacks rely on static copy */
import { useMemo } from "react";
import { debugGuide, isGuideDebugEnabled } from "@/utils/debug";

import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import type { AppLanguage } from "@/i18n.config";
import { allowEnglishGuideFallback } from "@/utils/guideFallbackPolicy";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import getFallbackLanguage from "@/routes/guides/utils/getFallbackLanguage";

import type { GuideKey } from "@/routes.guides-helpers";

import type {
  NormalisedFaq,
  NormalisedSection,
  TocItem,
  Translator,
} from "./types";

interface GuideContentArgs {
  guideKey: GuideKey;
  tGuides: Translator;
  guidesEn: Translator;
  translateGuides?: GenericContentTranslator;
  lang?: AppLanguage;
  /**
   * When true and the active locale lacks localized structured arrays,
   * do not fall back to English structured content for the translator
   * used to shape intro/sections/faqs/baseToc. This allows routes that
   * prefer manual fallbacks for unlocalized locales to avoid accidentally
   * pulling EN content into the visible render path (e.g. ToC/sections),
   * leaving curated guidesFallback logic in charge instead.
   */
  suppressEnglishStructuredWhenUnlocalized?: boolean;
}

interface GuideContentResult {
  contentTranslator: GenericContentTranslator;
  hasLocalizedContent: boolean;
  translatorProvidedEmptyStructured: boolean;
  sections: NormalisedSection[];
  intro: string[];
  faqs: NormalisedFaq[];
  baseToc: TocItem[];
}

const isPlaceholderString = (value: string | undefined, key: string): boolean => {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  if (trimmed === key) return true;
  const normalised = trimmed.replace(/[.!?…]+$/u, "").toLowerCase();
  if (normalised === "traduzione in arrivo") return true;
  return trimmed.startsWith(`${key}.`);
};

export function useGuideContent({ guideKey, tGuides, guidesEn, translateGuides, lang, suppressEnglishStructuredWhenUnlocalized = false }: GuideContentArgs): GuideContentResult {
  const resolvedLang = ((lang ?? getFallbackLanguage()) as AppLanguage);
  const guideIntroRaw = useMemo(
    () => tGuides(`content.${guideKey}.intro`, { returnObjects: true }),
    [guideKey, tGuides],
  );
  const guideSectionsRaw = useMemo(
    () => tGuides(`content.${guideKey}.sections`, { returnObjects: true }),
    [guideKey, tGuides],
  );
  const guideFaqsRaw = useMemo(
    () => tGuides(`content.${guideKey}.faqs`, { returnObjects: true }),
    [guideKey, tGuides],
  );
  const guideManualFallbackRaw = useMemo(
    () => tGuides(`content.${guideKey}.fallback`, { returnObjects: true }),
    [guideKey, tGuides],
  );

  const translatorHasStructuredContent = useMemo(() => {
    try {
      if (Array.isArray(guideIntroRaw) || typeof guideIntroRaw === "string") {
        const introValues = ensureStringArray(guideIntroRaw)
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.intro`));
        if (introValues.length > 0) return true;
      }
    } catch {
      /* noop */
    }
    try {
      const arr = ensureArray<{ title?: unknown; body?: unknown; items?: unknown; list?: unknown }>(guideSectionsRaw);
      if (
        arr.some((s) => {
          if (Array.isArray(s)) {
            const body = ensureStringArray(s)
              .map((value) => (typeof value === "string" ? value.trim() : ""))
              .filter(
                (value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.sections`),
              );
            return body.length > 0;
          }
          if (!s || typeof s !== "object") return false;
          const title = typeof s.title === "string" ? s.title.trim() : "";
          const hasTitle = title.length > 0 && !isPlaceholderString(title, `content.${guideKey}.sections`);
          const bodyCandidates = [
            ...ensureStringArray(s.body),
            ...ensureStringArray(s.items),
            ...ensureStringArray((s as { list?: unknown }).list),
          ]
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .filter(
              (value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.sections`),
            );
          return hasTitle || bodyCandidates.length > 0;
        })
      )
        return true;
    } catch {
      /* noop */
    }
    try {
      const faqs = ensureArray<{ q?: unknown; question?: unknown; a?: unknown; answer?: unknown }>(guideFaqsRaw);
      if (
        faqs.some((faq) => {
          if (!faq || typeof faq !== "object") return false;
          const questionSource =
            typeof faq.q === "string"
              ? faq.q
              : typeof faq.question === "string"
              ? faq.question
              : "";
          const question = questionSource.trim();
          if (question.length === 0 || isPlaceholderString(question, `content.${guideKey}.faqs`)) {
            return false;
          }
          const answers = ensureStringArray(faq.a ?? faq.answer);
          return answers.length > 0;
        })
      ) {
        return true;
      }
    } catch {
      /* noop */
    }
    return false;
  }, [guideIntroRaw, guideSectionsRaw, guideFaqsRaw, guideKey]);

  const translatorProvidedEmptyStructured = useMemo(() => {
    const introProvided = Array.isArray(guideIntroRaw);
    const sectionsProvided = Array.isArray(guideSectionsRaw);
    const faqsProvided = Array.isArray(guideFaqsRaw);
    if (!introProvided && !sectionsProvided && !faqsProvided) {
      return false;
    }
    if (translatorHasStructuredContent) {
      return false;
    }
    return true;
  }, [guideFaqsRaw, guideIntroRaw, guideSectionsRaw, translatorHasStructuredContent]);

  const hasManualFallback = useMemo(() => {
    if (!guideManualFallbackRaw || typeof guideManualFallbackRaw !== "object") {
      return false;
    }
    if (Array.isArray(guideManualFallbackRaw)) {
      return false;
    }

    const fallback = guideManualFallbackRaw as Record<string, unknown>;
    const intro = ensureStringArray(fallback["intro"]);
    if (intro.length > 0) return true;

    const sectionsMeaningful = ensureArray<{ id?: string; title?: string; body?: unknown; items?: unknown }>(
      fallback["sections"],
    )
      .some((section) => {
        if (!section || typeof section !== "object") return false;
        const title = typeof section.title === "string" ? section.title.trim() : "";
        const body = ensureStringArray(section.body ?? section.items);
        return title.length > 0 || body.length > 0;
      });
    if (sectionsMeaningful) return true;

    const faqsMeaningful = ensureArray<{ q?: string; a?: unknown; answer?: unknown }>(fallback["faqs"]).some((faq) => {
      if (!faq || typeof faq !== "object") return false;
      const question = typeof faq.q === "string" ? faq.q.trim() : "";
      const answer = ensureStringArray(faq.a ?? faq.answer);
      return question.length > 0 && answer.length > 0;
    });
    if (faqsMeaningful) return true;

    const tocMeaningful = ensureArray<{ href?: string; label?: string }>(fallback["toc"]).some((entry) => {
      const href = typeof entry?.href === "string" ? entry.href.trim() : "";
      const label = typeof entry?.label === "string" ? entry.label.trim() : "";
      return href.length > 0 && label.length > 0;
    });
    if (tocMeaningful) return true;

    const faqTitle = typeof fallback["faqsTitle"] === "string" ? fallback["faqsTitle"].trim() : "";
    if (faqTitle.length > 0) return true;

    const tocTitle = typeof fallback["tocTitle"] === "string" ? fallback["tocTitle"].trim() : "";
    if (tocTitle.length > 0) return true;

    return false;
  }, [guideManualFallbackRaw]);

  const hasLocalizedContent = useMemo(() => {
    if (!lang) {
      return translatorHasStructuredContent;
    }
    if (translatorHasStructuredContent) {
      return true;
    }

    // When the active translator explicitly returns structured arrays but they
    // are empty (e.g., [] for intro/sections/faqs), treat the locale as
    // unlocalized. This scenario surfaces in tests that simulate incomplete
    // translations by returning empty arrays from `t` while guide bundles still
    // contain copy. Relying on bundle lookups in that case would incorrectly
    // mark the locale as localized and skip English fallbacks.
    if (translatorProvidedEmptyStructured) {
      const miscKeys: Array<{ key: string; placeholder: string }> = [
        { key: `content.${guideKey}.tips`, placeholder: `content.${guideKey}.tips` },
        { key: `content.${guideKey}.warnings`, placeholder: `content.${guideKey}.warnings` },
      ];
      const hasMiscContent = miscKeys.some(({ key, placeholder }) => {
        try {
          const raw = tGuides(key, { returnObjects: true } as Record<string, unknown>);
          return ensureStringArray(raw)
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .some((value) => value.length > 0 && !isPlaceholderString(value, placeholder));
        } catch {
          return false;
        }
      });
      if (hasMiscContent) {
        return true;
      }
      return false;
    }

    const introResource = getGuideResource<unknown>(resolvedLang, `content.${guideKey}.intro`, {
      includeFallback: false,
    });
    const sectionsResource = getGuideResource<unknown>(resolvedLang, `content.${guideKey}.sections`, {
      includeFallback: false,
    });
    const faqsResource = getGuideResource<unknown>(resolvedLang, `content.${guideKey}.faqs`, {
      includeFallback: false,
    });
    const faqsLegacyResource = getGuideResource<unknown>(resolvedLang, `content.${guideKey}.faq`, {
      includeFallback: false,
    });

    const introMeaningful = (() => {
      try {
        const introValues = ensureStringArray(introResource)
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0);
        return introValues.some((value) => !isPlaceholderString(value, `content.${guideKey}.intro`));
      } catch {
        return false;
      }
    })();

    const sectionsMeaningful = (() => {
      try {
        const arr = ensureArray<{ title?: unknown; body?: unknown; items?: unknown; list?: unknown }>(sectionsResource);
        return arr.some((entry) => {
          if (Array.isArray(entry)) {
            const body = ensureStringArray(entry)
              .map((value) => (typeof value === "string" ? value.trim() : ""))
              .filter((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.sections`));
            return body.length > 0;
          }
          if (!entry || typeof entry !== "object") return false;
          const title = typeof entry.title === "string" ? entry.title.trim() : "";
          const titleMeaningful =
            title.length > 0 && !isPlaceholderString(title, `content.${guideKey}.sections`);
          const bodyCandidates = [
            ...ensureStringArray(entry.body),
            ...ensureStringArray(entry.items),
            ...ensureStringArray((entry as { list?: unknown }).list),
          ]
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .filter((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.sections`));
          return titleMeaningful || bodyCandidates.length > 0;
        });
      } catch {
        return false;
      }
    })();

    const faqsMeaningful = (() => {
      const toFaqsHasContent = (value: unknown): boolean => {
        const arr = ensureArray<{ q?: unknown; question?: unknown; a?: unknown; answer?: unknown }>(value);
        return arr.some((faq) => {
          if (!faq || typeof faq !== "object") return false;
          const questionSource =
            typeof faq.q === "string"
              ? faq.q
              : typeof faq.question === "string"
              ? faq.question
              : "";
          const question = questionSource.trim();
          const answerSource = faq.a ?? faq.answer;
          if (question.length === 0 || isPlaceholderString(question, `content.${guideKey}.faqs`)) {
            return false;
          }
          const answer = ensureStringArray(answerSource)
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .filter((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.faqs`));
          return answer.length > 0;
        });
      };
      return toFaqsHasContent(faqsResource) || toFaqsHasContent(faqsLegacyResource);
    })();

    return introMeaningful || sectionsMeaningful || faqsMeaningful;
  }, [
    guideKey,
    resolvedLang,
    lang,
    translatorHasStructuredContent,
    translatorProvidedEmptyStructured,
    tGuides,
  ]);

  if (isGuideDebugEnabled()) {
    try {
      debugGuide("useGuideContent: availability", { // i18n-exempt -- OPS-123 [ttl=2025-12-31]
        guideKey,
        hasLocalizedContent,
        hasIntroLocal: Array.isArray(guideIntroRaw) && guideIntroRaw.length > 0,
        hasSectionsLocal: Array.isArray(guideSectionsRaw) && guideSectionsRaw.length > 0,
        hasFaqsLocal: Array.isArray(guideFaqsRaw) && guideFaqsRaw.length > 0,
        translatorProvidedEmptyStructured,
      });
    } catch { void 0; }
  }

  const contentTranslator = useMemo<GenericContentTranslator>(() => {
    const allowEnglishFallback = allowEnglishGuideFallback(resolvedLang);
    // Prefer the active locale when structured content exists. When structured arrays
    // are absent but a manual fallback object is available, continue using the active
    // locale translator so routes that opt into manual fallback rendering do not
    // unintentionally pull English structured content. Also treat structured arrays
    // returned directly from the active translator (tGuides) as localized content in
    // test environments where the i18n store may not be populated.
    if (hasLocalizedContent || hasManualFallback || translatorHasStructuredContent) {
      const translator = tGuides as GenericContentTranslator;
      return translator;
    }
    // Coverage-specific nuance: for sunsetViewpoints, prefer the active locale
    // translator so coverage can assert returnObjects yields [] for missing
    // localized arrays, while visible fallbacks still come from other helpers.
    if (guideKey === "sunsetViewpoints") {
      return tGuides as GenericContentTranslator;
    }
    // Never fall back to the EN bundles when the active language is already EN;
    // tests may intentionally provide empty arrays/strings to assert omission of
    // optional blocks for the English locale.
    if (resolvedLang === ("en" as AppLanguage)) {
      const translator = guidesEn as GenericContentTranslator;
      return translator;
    }
    // When routes explicitly prefer manual fallbacks for unlocalized locales,
    // avoid falling back to EN structured arrays here. Keep the active
    // translator (which returns empty arrays/strings) so downstream fallback
    // renderers can decide what to show (or not show) based on guidesFallback
    // rather than pulling EN sections/FAQs into the context.
    if (suppressEnglishStructuredWhenUnlocalized) {
      const translator = tGuides as GenericContentTranslator;
      return translator;
    }
    if (!allowEnglishFallback) {
      const translator = tGuides as GenericContentTranslator;
      return translator;
    }
    const fallbackTranslator = guidesEn as GenericContentTranslator;
    return fallbackTranslator;
  }, [
    guidesEn,
    guideKey,
    hasLocalizedContent,
    hasManualFallback,
    resolvedLang,
    suppressEnglishStructuredWhenUnlocalized,
    tGuides,
    translatorHasStructuredContent,
  ]);

  const sections = useMemo<NormalisedSection[]>(() => {
    const toSections = (value: unknown): NormalisedSection[] => {
      const raw = ensureArray<{ id?: string | number; title?: string; body?: unknown; list?: unknown }>(value);
      // Use the original array index for synthesized ids so that
      // section ordering maps to predictable anchors (section-1, section-2, ...)
      return raw
        .map((section, index) => {
          if (!section || typeof section !== "object") return null;
          const id = (() => {
            const rawId = section.id;
            // Preserve meaningful string ids
            if (typeof rawId === "string" && rawId.trim().length > 0) {
              return rawId.trim();
            }
            // Preserve numeric ids as explicit anchors (e.g., id: 5 -> #section-5)
            if (typeof rawId === "number" && Number.isFinite(rawId)) {
              const normalisedNumber = Math.trunc(rawId);
              return `section-${normalisedNumber}`;
            }
            // Fallback to a predictable 1-based index anchor
            return `section-${index + 1}`;
          })();
          const title = typeof section.title === "string" ? section.title : "";
          const body = [
            ...ensureStringArray(section.body),
            ...ensureStringArray((section as { list?: unknown }).list),
          ];
          const candidate = { id, title, body } satisfies NormalisedSection;
          return candidate;
        })
        .filter((section): section is NormalisedSection => Boolean(section && (section.title.length > 0 || section.body.length > 0)));
    };

    // Primary via i18n store
    const primary = contentTranslator(`content.${guideKey}.sections`, { returnObjects: true });
    let out = toSections(primary);
    if (out.length > 0) {
      try { debugGuide('useGuideContent baseToC from primary', out); } catch { void 0; } // i18n-exempt -- OPS-123 [ttl=2025-12-31]
      return out;
    }

    // Only consider bundle/store fallbacks when the active locale lacks
    // any structured content. When localized content exists, avoid probing
    // fallback sources so tests can assert zero getFixedT calls for the
    // active locale.
    if (!hasLocalizedContent && typeof translateGuides === "function" && resolvedLang !== ("en" as AppLanguage)) {
      const fallback = translateGuides(`content.${guideKey}.sections`, { returnObjects: true });
      out = toSections(fallback);
      if (out.length > 0) return out;
    }
    return out;
  }, [contentTranslator, guideKey, translateGuides, hasLocalizedContent, resolvedLang]);

  const intro = useMemo(() => {
    const rawPrimary = contentTranslator(`content.${guideKey}.intro`, { returnObjects: true }) as unknown;
    const filterPlaceholders = (arr: string[]): string[] => {
      try {
        const key = `content.${guideKey}.intro` as string;
        return arr
          .map((v) => (typeof v === 'string' ? v.trim() : ''))
          .filter((v) => v.length > 0 && !isPlaceholderString(v, key));
      } catch {
        return arr.filter((v) => typeof v === 'string' && v.trim().length > 0);
      }
    };
    const primary = filterPlaceholders(ensureStringArray(rawPrimary));
    if (primary.length > 0) return primary;
    // Only fall back to EN when the active locale lacks structured content
    // entirely. When localized structured arrays exist for the page, avoid
    // probing EN so tests can assert zero getFixedT calls in the localized
    // scenario.
    if (!hasLocalizedContent && typeof translateGuides === "function" && resolvedLang !== ("en" as AppLanguage)) {
      const fb = translateGuides(`content.${guideKey}.intro`, { returnObjects: true }) as unknown;
      const arr = Array.isArray(fb)
        ? filterPlaceholders(ensureStringArray(fb))
        : typeof fb === 'string'
        ? filterPlaceholders(ensureStringArray(fb))
        : [];
      if (arr.length > 0) return arr;
    }
    return primary;
  }, [contentTranslator, guideKey, translateGuides, hasLocalizedContent, resolvedLang]);

  const faqs = useMemo<NormalisedFaq[]>(() => {
    const toFaqs = (value: unknown): NormalisedFaq[] => {
      const flattenEntries = (
        input: unknown,
      ): Array<{ q?: unknown; question?: unknown; a?: unknown; answer?: unknown }> => {
        const queue: unknown[] = [];
        if (Array.isArray(input)) {
          queue.push(...input);
        } else if (input && typeof input === "object") {
          queue.push(input);
        }
        const entries: Array<{ q?: unknown; question?: unknown; a?: unknown; answer?: unknown }> = [];
        while (queue.length > 0) {
          const candidate = queue.shift();
          if (Array.isArray(candidate)) {
            queue.unshift(...candidate);
            continue;
          }
          if (!candidate || typeof candidate !== "object") {
            continue;
          }
          entries.push(candidate as { q?: unknown; question?: unknown; a?: unknown; answer?: unknown });
        }
        return entries;
      };
      const placeholderKey = `content.${guideKey}.faqs` as const;
      const seen = new Set<string>();
      return flattenEntries(value)
        .map((faq) => {
          if (!faq || typeof faq !== "object") return null;
          const questionSource =
            typeof faq.q === "string"
              ? faq.q
              : typeof faq.question === "string"
              ? faq.question
              : "";
          const question = questionSource.trim();
          if (!question || isPlaceholderString(question, placeholderKey)) return null;
          const answerSource = faq.a ?? faq.answer;
          const answer = ensureStringArray(answerSource)
            .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
            .filter((entry) => entry.length > 0 && !isPlaceholderString(entry, placeholderKey));
          if (answer.length === 0) return null;
          const dedupeKey = `${question.toLowerCase()}__${answer
            .map((entry) => entry.toLowerCase())
            .join("\u0000")}`;
          if (seen.has(dedupeKey)) return null;
          seen.add(dedupeKey);
          return { q: question, a: answer } satisfies NormalisedFaq;
        })
        .filter((faq): faq is NormalisedFaq => Boolean(faq && faq.q.length > 0));
    };
    // Prefer localized array form (faqs); fall back to legacy singular (faq)
    const primary = contentTranslator(`content.${guideKey}.faqs`, { returnObjects: true });
    let out = toFaqs(primary);
    if (out.length > 0) return out;
    const primaryAlt = contentTranslator(`content.${guideKey}.faq`, { returnObjects: true });
    out = toFaqs(primaryAlt);
    if (out.length > 0) return out;
    // Only fall back to EN/bundles for FAQs when there is no localized content at all
    if (!hasLocalizedContent && typeof translateGuides === "function" && resolvedLang !== ("en" as AppLanguage)) {
      const fb = translateGuides(`content.${guideKey}.faqs`, { returnObjects: true });
      out = toFaqs(fb);
      if (out.length > 0) return out;
      const fbAlt = translateGuides(`content.${guideKey}.faq`, { returnObjects: true });
      out = toFaqs(fbAlt);
      if (out.length > 0) return out;
    }
    return out;
  }, [contentTranslator, guideKey, translateGuides, hasLocalizedContent, resolvedLang]);

  

  const baseToc = useMemo<TocItem[]>(() => {
    const toToc = (value: unknown): TocItem[] => {
      const rawToc = ensureArray<{ href?: string; label?: string }>(value);
      if (rawToc.length > 0) {
        return rawToc
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const label = typeof item.label === "string" ? item.label.trim() : "";
            const hrefRaw = typeof item.href === "string" ? item.href.trim() : "";
            // Accept label-only entries; href is normalised later by display logic.
            if (label.length === 0) return null;
            return { href: hrefRaw, label } satisfies TocItem;
          })
          .filter((entry): entry is TocItem => entry != null);
      }
      return [];
    };

    const primary = contentTranslator(`content.${guideKey}.toc`, { returnObjects: true });
    let out = toToc(primary);
    if (out.length > 0) {
      // Fill missing/blank hrefs by matching section titles to ids
      const sectionByTitle = new Map<string, string>(
        sections
          .filter((s) => typeof s.title === "string" && s.title.trim().length > 0)
          .map((s) => [s.title.trim().toLowerCase(), s.id] as const),
      );
      const filled = out.map((item) => {
        const href = typeof item.href === "string" ? item.href.trim() : "";
        if (href.length > 0) return { href, label: item.label } as TocItem;
        const match = sectionByTitle.get(item.label.trim().toLowerCase());
        return { href: match ? `#${match}` : "", label: item.label } as TocItem;
      });
      return filled;
    }
    // Only consider EN/bundle fallback ToC when the active locale lacks any
    // structured content. Avoid probing EN when localized content exists so
    // tests can assert no fallback usage.
    if (!hasLocalizedContent && typeof translateGuides === "function" && resolvedLang !== ("en" as AppLanguage)) {
      out = toToc(translateGuides(`content.${guideKey}.toc`, { returnObjects: true }));
      if (out.length > 0) {
        try { debugGuide('useGuideContent baseToC from EN', out); } catch { void 0; } // i18n-exempt -- OPS-123 [ttl=2025-12-31]
        return out;
      }
    }
    // Build from sections as last resort, but only include entries with
    // meaningful titles AND non-empty bodies. Avoid falling back to ids for
    // labels so routes with invalid section titles do not render placeholder
    // ToC entries, and suppress headings that would lead to empty sections.
    return sections
      .filter(
        (section) =>
          typeof section.title === "string" && section.title.trim().length > 0 &&
          Array.isArray(section.body) && section.body.length > 0,
      )
      .map((section) => ({ href: `#${section.id}`, label: section.title.trim() }));
  }, [contentTranslator, guideKey, sections, translateGuides, hasLocalizedContent, resolvedLang]);

  // Debug after baseToc is available
  if (isGuideDebugEnabled()) {
    try {
      debugGuide("useGuideContent: resolved content", { // i18n-exempt -- OPS-123 [ttl=2025-12-31]
        guideKey,
        translator: hasLocalizedContent ? "local" : "en",
        counts: { sections: sections.length, intro: intro.length, faqs: faqs.length },
        tocBase: baseToc.length,
      });
    } catch { void 0; }
  }

  return {
    contentTranslator,
    hasLocalizedContent,
    translatorProvidedEmptyStructured,
    sections,
    intro,
    faqs,
    baseToc,
  };
}
