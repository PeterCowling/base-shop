// src/routes/guides/ferry-schedules/extras.ts
import { ensureStringArray } from "@/utils/i18nContent";

import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";

import { GUIDE_KEY } from "./constants";
import { getGuidesFallbackTranslator, getGuidesTranslator, getStaticFallbackValue } from "./i18n";
import { normaliseFaqs, normaliseGallery, normaliseSections } from "./normalisers";
import { buildPlaceholderKeys, sanitiseArrayValues, sanitiseStringValue } from "./placeholders";
import type { GuideExtras } from "./types";

export function buildFerrySchedulesGuideExtras(
  gallerySources: readonly string[],
  context: GuideSeoTemplateContext,
): GuideExtras {
  const translate = context.translateGuides;
  const translateString = (key: string, fallback?: string): string => {
    const value = translate(key);
    if (typeof value === "string" && value.trim().length > 0 && value !== key) {
      return value.trim();
    }
    return fallback ?? "";
  };
  const fallbackTranslator = getGuidesFallbackTranslator(context.lang);
  const fallbackEnTranslator = getGuidesFallbackTranslator("en");
  const guidesEn = getGuidesTranslator("en");

  const labelFromGuides = (key: string) => {
    const fallbackValue = guidesEn("labels." + key) as string | undefined;
    const value = translateString("labels." + key, fallbackValue);
    if (typeof value === "string" && value.trim().length > 0 && value !== key) {
      return value.trim();
    }
    if (typeof fallbackValue === "string" && fallbackValue.trim().length > 0) {
      return fallbackValue.trim();
    }
    return key;
  };

  const baseLabels = {
    onThisPage: labelFromGuides("onThisPage"),
    tips: labelFromGuides("tipsHeading"),
    faqs: labelFromGuides("faqsHeading"),
    gallery: labelFromGuides("photoGallery"),
  };

  type FallbackStage = "primary" | "fallbackLocal" | "fallbackEnglish" | "static";

  const withFallback = <T,>(
    primaryKey: string,
    fallbackKey: string,
    normaliser: (value: unknown, stage: FallbackStage) => T[],
  ): T[] => {
    const placeholderKeys = buildPlaceholderKeys(primaryKey, fallbackKey);
    const apply = (value: unknown, stage: FallbackStage) =>
      sanitiseArrayValues(normaliser(value, stage), placeholderKeys);
    const primary = apply(translate(primaryKey, { returnObjects: true }), "primary");
    if (primary.length > 0) return primary;

    const fallbackLocal = apply(
      fallbackTranslator(fallbackKey, { returnObjects: true }),
      "fallbackLocal",
    );
    if (fallbackLocal.length > 0) return fallbackLocal;

    const fallbackEnglish = apply(
      fallbackEnTranslator(fallbackKey, { returnObjects: true }),
      "fallbackEnglish",
    );
    if (fallbackEnglish.length > 0) return fallbackEnglish;

    return apply(getStaticFallbackValue(fallbackKey), "static");
  };

  const intro = withFallback(`content.${GUIDE_KEY}.intro`, `${GUIDE_KEY}.intro`, ensureStringArray);
  const sections = withFallback(
    `content.${GUIDE_KEY}.sections`,
    `${GUIDE_KEY}.sections`,
    (value, stage) =>
      normaliseSections(value, {
        preserveBodyWhitespace: stage === "primary" || stage === "fallbackLocal",
      }),
  );
  const faqPlaceholderKeys = buildPlaceholderKeys(`content.${GUIDE_KEY}.faqs`, `${GUIDE_KEY}.faqs`);
  const faqs = withFallback(`content.${GUIDE_KEY}.faqs`, `${GUIDE_KEY}.faqs`, normaliseFaqs)
    .map((faq) => {
      const answers = sanitiseArrayValues(faq.a, faqPlaceholderKeys) as string[];
      if (answers.length === 0) return null;
      return { ...faq, a: answers } satisfies GuideExtras["faqs"][number];
    })
    .filter((faq): faq is GuideExtras["faqs"][number] => faq != null);
  const tipsRaw = withFallback(`content.${GUIDE_KEY}.tips`, `${GUIDE_KEY}.tips`, ensureStringArray);
  const placeholderKeys = buildPlaceholderKeys(
    `content.${GUIDE_KEY}.tips`,
    `${GUIDE_KEY}.tips`,
  );
  const tips = sanitiseArrayValues(tipsRaw, placeholderKeys);

  const resolveFallbackString = (
    primaryKey: string,
    fallbackKey: string,
    defaultValue: string,
  ): string => {
    const placeholderSet = buildPlaceholderKeys(primaryKey, fallbackKey);
    const fallbackLocal = sanitiseStringValue(
      fallbackTranslator(fallbackKey) as string | undefined,
      placeholderSet,
    );
    const fallbackEnglish = sanitiseStringValue(
      fallbackEnTranslator(fallbackKey) as string | undefined,
      placeholderSet,
    );
    const staticFallback = sanitiseStringValue(
      getStaticFallbackValue(fallbackKey),
      placeholderSet,
    );
    const fallbackValue = fallbackLocal ?? fallbackEnglish ?? staticFallback ?? defaultValue;
    const resolved = translateString(primaryKey, fallbackValue);
    return sanitiseStringValue(resolved, placeholderSet) ?? fallbackValue;
  };

  const faqsTitle = resolveFallbackString(
    `content.${GUIDE_KEY}.faqsTitle`,
    `${GUIDE_KEY}.faqsTitle`,
    baseLabels.faqs,
  );

  const tipsTitle = resolveFallbackString(
    `content.${GUIDE_KEY}.tipsTitle`,
    `${GUIDE_KEY}.tipsTitle`,
    baseLabels.tips,
  );

  const tocRaw = translate(`content.${GUIDE_KEY}.toc`, { returnObjects: true });
  const tocRecord = tocRaw && typeof tocRaw === "object" && !Array.isArray(tocRaw)
    ? (tocRaw as Record<string, unknown>)
    : {};

  const resolveLabel = (tocKey: string, fallback?: string) => {
    const placeholderSet = buildPlaceholderKeys(
      `content.${GUIDE_KEY}.toc.${tocKey}`,
      `${GUIDE_KEY}.toc.${tocKey}`,
    );
    const raw = tocRecord[tocKey];
    if (typeof raw === "string") {
      const sanitized = sanitiseStringValue(raw, placeholderSet);
      if (sanitized) {
        return sanitized;
      }
    }
    const fallbackLocal = sanitiseStringValue(
      fallbackTranslator(`${GUIDE_KEY}.toc.${tocKey}`) as string | undefined,
      placeholderSet,
    );
    if (fallbackLocal) {
      return fallbackLocal;
    }
    const fallbackEnglish = sanitiseStringValue(
      fallbackEnTranslator(`${GUIDE_KEY}.toc.${tocKey}`) as string | undefined,
      placeholderSet,
    );
    if (fallbackEnglish) {
      return fallbackEnglish;
    }
    return fallback;
  };

  const tocTitle = resolveLabel("onThisPage", baseLabels.onThisPage) ?? baseLabels.onThisPage;

  const tocItems: Array<{ href: string; label: string }> = [];
  const appendTocItem = (href: string, label?: string) => {
    if (!href || typeof label !== "string") return;
    const trimmedLabel = label.trim();
    if (trimmedLabel.length === 0) return;
    if (tocItems.some((item) => item.href === href)) return;
    tocItems.push({ href, label: trimmedLabel });
  };

  const sectionIds = new Set(sections.map((section) => section.id));
  const isDuplicateAnchor = (id: string): boolean => {
    const baseId = id.replace(/-\d+$/, "");
    return baseId !== id && sectionIds.has(baseId);
  };

  sections.forEach((section) => {
    if (isDuplicateAnchor(section.id)) return;
    const label = section.title.trim().length > 0 ? section.title : section.id;
    appendTocItem(`#${section.id}`, label);
  });
  if (tips.length > 0) {
    appendTocItem("#tips", resolveLabel("tips", baseLabels.tips) ?? baseLabels.tips);
  }
  if (faqs.length > 0) {
    // Prefer the shared FAQs label in the TOC; fall back to the long-form heading only when needed.
    const faqTocLabel =
      resolveLabel("faqs") ??
      (typeof baseLabels.faqs === "string" && baseLabels.faqs.trim().length > 0
        ? baseLabels.faqs
        : undefined) ??
      (faqsTitle.trim().length > 0 ? faqsTitle : undefined);
    appendTocItem("#faqs", faqTocLabel);
  }

  const fallbackLocalGallery = fallbackTranslator(`${GUIDE_KEY}.gallery`, { returnObjects: true });
  const fallbackEnglishGallery = fallbackEnTranslator(`${GUIDE_KEY}.gallery`, { returnObjects: true });
  // We intentionally do NOT use static gallery fallbacks here to avoid mixing
  // caption/alt from static content with localized or English items. Static
  // gallery content is only used for copy elsewhere (titles, tips, etc.).
  const galleryItemsAll = normaliseGallery(
    fallbackLocalGallery,
    fallbackEnglishGallery,
    [],
    gallerySources,
    translateString,
    baseLabels.gallery,
  );
  // If neither localized nor English gallery fallbacks exist, show only the
  // primary hero image with a generic gallery alt; suppress additional images.
  const hasAnyLocalizedGallery = (() => {
    const coerceItems = (value: unknown): Array<unknown> => {
      if (Array.isArray(value)) return value;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const record = value as Record<string, unknown>;
        if (Array.isArray(record["items"])) return record["items"] as unknown[];
        if (record["alt"] != null || record["caption"] != null) return [record];
      }
      return [];
    };
    return coerceItems(fallbackLocalGallery).length > 0 || coerceItems(fallbackEnglishGallery).length > 0;
  })();
  const galleryItems = hasAnyLocalizedGallery ? galleryItemsAll : galleryItemsAll.slice(0, 1);
  const galleryTitle = resolveFallbackString(
    `content.${GUIDE_KEY}.galleryTitle`,
    `${GUIDE_KEY}.galleryTitle`,
    baseLabels.gallery,
  );
  if (galleryItems.length > 0) {
    appendTocItem("#gallery", resolveLabel("gallery", galleryTitle) ?? galleryTitle);
  }

  return {
    intro,
    sections,
    tips,
    tipsTitle,
    faqs,
    faqsTitle,
    tocTitle,
    tocItems,
    galleryTitle,
    galleryItems,
  } satisfies GuideExtras;
}
