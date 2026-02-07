import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import {
  type DateValidationResult,
  type GuideDiagnosticResult,
  type GuideFieldStatus,
  type SeoFieldStatus,
  type TranslationCoverageResult,
} from "./guide-diagnostics.types";
import { isPlaceholderString } from "./guide-seo/content-detection";

type FaqEntry = { q?: unknown; question?: unknown; a?: unknown; answer?: unknown };

const normalizeText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const hasMeaningfulString = (value: unknown, placeholderKey: string): boolean => {
  const text = normalizeText(value);
  if (!text) return false;
  if (isPlaceholderString(text, placeholderKey)) return false;
  return true;
};

const hasIntroContent = (introRaw: unknown, guideKey: GuideKey): boolean => {
  try {
    return ensureStringArray(introRaw)
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .some((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.intro`));
  } catch {
    return false;
  }
};

const hasSectionsContent = (sectionsRaw: unknown, guideKey: GuideKey): boolean => {
  try {
    const arr = ensureArray<{ title?: unknown; body?: unknown; items?: unknown; list?: unknown }>(sectionsRaw);
    return arr.some((entry) => {
      if (Array.isArray(entry)) {
        const body = ensureStringArray(entry)
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.sections`));
        return body.length > 0;
      }
      if (!entry || typeof entry !== "object") return false;
      const title = typeof entry.title === "string" ? entry.title.trim() : "";
      const titleMeaningful = title.length > 0 && !isPlaceholderString(title, `content.${guideKey}.sections`);
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
};

const countFaqEntries = (faqsRaw: unknown, guideKey: GuideKey): number => {
  try {
    const faqs = ensureArray<FaqEntry>(faqsRaw);
    return faqs.filter((faq) => {
      if (!faq || typeof faq !== "object") return false;
      const questionSource =
        typeof faq.q === "string" ? faq.q : typeof faq.question === "string" ? faq.question : "";
      const question = questionSource.trim();
      if (!question || isPlaceholderString(question, `content.${guideKey}.faqs`)) return false;
      const answers = ensureStringArray(faq.a ?? faq.answer)
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.faqs`));
      return answers.length > 0;
    }).length;
  } catch {
    return 0;
  }
};

const getSeoFields = (guideKey: GuideKey, lang: AppLanguage): SeoFieldStatus => {
  const seoTitle =
    getGuideResource<string>(lang, `content.${guideKey}.seo.title`, { includeFallback: false }) ??
    getGuideResource<string>(lang, `content.${guideKey}.seoTitle`, { includeFallback: false });
  const seoDescription =
    getGuideResource<string>(lang, `content.${guideKey}.seo.description`, { includeFallback: false }) ??
    getGuideResource<string>(lang, `content.${guideKey}.seoDescription`, { includeFallback: false });

  const titleKey = seoTitle ? `content.${guideKey}.seo.title` : `content.${guideKey}.seoTitle`;
  const descriptionKey = seoDescription
    ? `content.${guideKey}.seo.description`
    : `content.${guideKey}.seoDescription`;

  return {
    title: hasMeaningfulString(seoTitle, titleKey),
    description: hasMeaningfulString(seoDescription, descriptionKey),
  };
};

const buildFieldStatus = (guideKey: GuideKey, lang: AppLanguage): GuideFieldStatus & { seoFields: SeoFieldStatus; faqCount: number } => {
  const introRaw = getGuideResource<unknown>(lang, `content.${guideKey}.intro`, { includeFallback: false });
  const sectionsRaw = getGuideResource<unknown>(lang, `content.${guideKey}.sections`, { includeFallback: false });
  const faqsRaw = getGuideResource<unknown>(lang, `content.${guideKey}.faqs`, { includeFallback: false });
  const faqsLegacyRaw = getGuideResource<unknown>(lang, `content.${guideKey}.faq`, { includeFallback: false });

  const intro = hasIntroContent(introRaw, guideKey);
  const sections = hasSectionsContent(sectionsRaw, guideKey);
  const faqCount = Math.max(countFaqEntries(faqsRaw, guideKey), countFaqEntries(faqsLegacyRaw, guideKey));
  const faqs = faqCount > 0;
  const seoFields = getSeoFields(guideKey, lang);
  const seo = seoFields.title && seoFields.description;

  return { intro, sections, faqs, seo, seoFields, faqCount };
};

export function analyzeGuideCompleteness(guideKey: GuideKey, lang: AppLanguage): GuideDiagnosticResult {
  const fields = buildFieldStatus(guideKey, lang);
  return {
    guideKey,
    lang,
    fields: {
      intro: fields.intro,
      sections: fields.sections,
      faqs: fields.faqs,
      seo: fields.seo,
    },
    seoFields: fields.seoFields,
    faqCount: fields.faqCount,
  };
}

export function analyzeTranslationCoverage(
  guideKey: GuideKey,
  locales: readonly AppLanguage[],
): TranslationCoverageResult {
  // Determine which fields are required based on English reference.
  // Only require fields that the English source actually provides so we
  // don't flag locales for optional content (ex: guides without intros).
  const englishFields = buildFieldStatus(guideKey, "en");
  const requiredFields: Array<keyof GuideFieldStatus> = [];
  if (englishFields.intro) requiredFields.push("intro");
  if (englishFields.sections) requiredFields.push("sections");
  if (englishFields.seo) requiredFields.push("seo");
  if (englishFields.faqs) requiredFields.push("faqs");

  const results = locales.map((locale) => {
    const fields = buildFieldStatus(guideKey, locale);
    const fieldsSummary: GuideFieldStatus = {
      intro: fields.intro,
      sections: fields.sections,
      faqs: fields.faqs,
      seo: fields.seo,
    };
    // Only check required fields when determining completion status
    const missing = requiredFields.filter((key) => !fieldsSummary[key]);
    const complete = missing.length === 0;
    return {
      locale,
      fields: fieldsSummary,
      missing,
      complete,
    };
  });

  const completeLocales = results.filter((entry) => entry.complete).map((entry) => entry.locale);
  const missingLocales = results.filter((entry) => !entry.complete).map((entry) => entry.locale);

  return {
    guideKey,
    totalLocales: results.length,
    locales: results,
    completeLocales,
    missingLocales,
  };
}

export function analyzeDateValidation(
  guideKey: GuideKey,
  locales: readonly AppLanguage[],
): DateValidationResult {
  // Check if English has a lastUpdated date
  const englishDateRaw = getGuideResource<string>("en", `content.${guideKey}.lastUpdated`, { includeFallback: false });
  const englishDate = englishDateRaw && typeof englishDateRaw === "string" && englishDateRaw.trim().length > 0
    ? englishDateRaw
    : undefined;
  const hasEnglishDate = Boolean(englishDate);

  if (!hasEnglishDate) {
    // If English doesn't have a date, no validation needed
    return {
      hasEnglishDate: false,
      localesWithDate: [],
      localesMissingDate: [],
    };
  }

  const localesWithDate: AppLanguage[] = [];
  const localesMissingDate: AppLanguage[] = [];

  // Check each locale for lastUpdated
  for (const locale of locales) {
    if (locale === "en") {
      // Skip English since we already checked it
      localesWithDate.push("en");
      continue;
    }

    const localeDate = getGuideResource<string>(locale, `content.${guideKey}.lastUpdated`, { includeFallback: false });
    const hasDate = Boolean(localeDate && typeof localeDate === "string" && localeDate.trim().length > 0);

    if (hasDate) {
      localesWithDate.push(locale);
    } else {
      localesMissingDate.push(locale);
    }
  }

  return {
    hasEnglishDate,
    englishDate,
    localesWithDate,
    localesMissingDate,
  };
}
