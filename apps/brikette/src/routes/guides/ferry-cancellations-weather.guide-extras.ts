import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";
import { ensureStringArray } from "@/utils/i18nContent";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { GUIDE_KEY } from "./ferry-cancellations-weather.constants";
import { normaliseFaqs, normaliseGallery, normaliseSections } from "./ferry-cancellations-weather.normalisers";
import { getGuidesFallbackTranslator, getGuidesTranslator } from "./ferry-cancellations-weather.translators";
import type { FerryFaq, GuideExtras } from "./ferry-cancellations-weather.types";

const ensureLabel = (value: string | undefined, fallback: string): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
};

const buildLabelGetter = (
  translateString: (key: string, fallback?: string) => string,
  guidesEn: ReturnType<typeof getGuidesTranslator>,
) => {
  return (key: string) => {
    const fallbackValue =
      typeof guidesEn === "function" ? (guidesEn("labels." + key) as string | undefined) : undefined;
    const value = translateString("labels." + key, fallbackValue);
    if (typeof value === "string" && value.trim().length > 0 && value !== key) {
      return value.trim();
    }
    if (typeof fallbackValue === "string" && fallbackValue.trim().length > 0) {
      return fallbackValue.trim();
    }
    return key;
  };
};

const buildTranslateString = (
  translate: GuideSeoTemplateContext["translateGuides"],
  fallbackTranslator: ReturnType<typeof getGuidesFallbackTranslator>,
  fallbackEn: ReturnType<typeof getGuidesFallbackTranslator>,
) => {
  return (key: string, fallback?: string): string => {
    const value = translate(key);
    if (typeof value === "string" && value.trim().length > 0 && value !== key) {
      return value.trim();
    }
    const fallbackValue = fallbackTranslator(key.replace(/^content\./, "")) as string | undefined;
    if (typeof fallbackValue === "string" && fallbackValue.trim().length > 0) {
      return fallbackValue.trim();
    }
    const fallbackEnValue = fallbackEn(key.replace(/^content\./, ""), { defaultValue: fallback }) as
      | string
      | undefined;
    if (typeof fallbackEnValue === "string" && fallbackEnValue.trim().length > 0) {
      return fallbackEnValue.trim();
    }
    return fallback ?? "";
  };
};

const readArray = <T,>(
  translate: GuideSeoTemplateContext["translateGuides"],
  fallbackTranslator: ReturnType<typeof getGuidesFallbackTranslator>,
  fallbackEn: ReturnType<typeof getGuidesFallbackTranslator>,
  suffix: string,
  normaliser: (value: unknown) => T[],
): T[] => {
  const primary = normaliser(translate(`content.${GUIDE_KEY}.${suffix}`, { returnObjects: true }));
  if (primary.length > 0) return primary;
  const localFallback = normaliser(fallbackTranslator(`${GUIDE_KEY}.${suffix}`, { returnObjects: true }));
  if (localFallback.length > 0) return localFallback;
  return normaliser(fallbackEn(`${GUIDE_KEY}.${suffix}`, { returnObjects: true }));
};

const resolveTocLabel = (
  translate: GuideSeoTemplateContext["translateGuides"],
  fallbackTranslator: ReturnType<typeof getGuidesFallbackTranslator>,
  fallbackEn: ReturnType<typeof getGuidesFallbackTranslator>,
  translateString: (key: string, fallback?: string) => string,
  tocKey: string,
  fallback: string,
): string => {
  const tocRaw = translate(`content.${GUIDE_KEY}.toc`, { returnObjects: true });
  const tocRecord = tocRaw && typeof tocRaw === "object" && !Array.isArray(tocRaw) ? (tocRaw as Record<string, unknown>) : {};

  const raw = tocRecord[tocKey];
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim();
  }

  const fallbackValue = fallbackTranslator(`${GUIDE_KEY}.toc`, { returnObjects: true }) as Record<string, unknown> | undefined;
  const fallbackLabel = typeof fallbackValue?.[tocKey] === "string" ? (fallbackValue[tocKey] as string).trim() : undefined;
  if (fallbackLabel && fallbackLabel.length > 0) {
    return fallbackLabel;
  }

  const fallbackEnValue = fallbackEn(`${GUIDE_KEY}.toc`, { returnObjects: true }) as Record<string, unknown> | undefined;
  const fallbackEnLabel =
    typeof fallbackEnValue?.[tocKey] === "string" ? (fallbackEnValue[tocKey] as string).trim() : undefined;
  if (fallbackEnLabel && fallbackEnLabel.length > 0) {
    return fallbackEnLabel;
  }

  return translateString(`content.${GUIDE_KEY}.toc.${tocKey}`, fallback);
};

export const createGuideExtrasBuilder = (gallerySources: readonly string[]) =>
  (context: GuideSeoTemplateContext): GuideExtras => {
    const translate = context.translateGuides;
    const fallbackTranslator = getGuidesFallbackTranslator(context.lang);
    const fallbackEn = getGuidesFallbackTranslator("en");
    const guidesEn = getGuidesTranslator("en");

    const translateString = buildTranslateString(translate, fallbackTranslator, fallbackEn);
    const labelFromGuides = buildLabelGetter(translateString, guidesEn);

    const baseLabels = {
      onThisPage: labelFromGuides("onThisPage"),
      tips: labelFromGuides("tipsHeading"),
      faqs: labelFromGuides("faqsHeading"),
      gallery: labelFromGuides("photoGallery"),
    };

    const intro = readArray(translate, fallbackTranslator, fallbackEn, "intro", ensureStringArray);
    const sections = readArray(translate, fallbackTranslator, fallbackEn, "sections", normaliseSections);
    const tips = readArray(translate, fallbackTranslator, fallbackEn, "tips", ensureStringArray);
    const faqs = readArray(translate, fallbackTranslator, fallbackEn, "faqs", normaliseFaqs);

    const faqsTitle = ensureLabel(
      translateString(
        `content.${GUIDE_KEY}.faqsTitle`,
        (fallbackTranslator(`${GUIDE_KEY}.faqsTitle`) as string | undefined) ||
          (fallbackEn(`${GUIDE_KEY}.faqsTitle`, {
            defaultValue: baseLabels.faqs,
          }) as string | undefined) ||
          baseLabels.faqs,
      ),
      baseLabels.faqs,
    );

    const tipsTitle = ensureLabel(
      translateString(
        `content.${GUIDE_KEY}.tipsTitle`,
        (fallbackTranslator(`${GUIDE_KEY}.tipsTitle`) as string | undefined) || baseLabels.tips,
      ),
      baseLabels.tips,
    );

    const galleryItems = normaliseGallery(
      fallbackTranslator(`${GUIDE_KEY}.gallery`, { returnObjects: true }),
      gallerySources,
      translateString,
      baseLabels.gallery,
    );

    const galleryTitle = ensureLabel(
      translateString(
        `content.${GUIDE_KEY}.galleryTitle`,
        (fallbackTranslator(`${GUIDE_KEY}.galleryTitle`) as string | undefined) || baseLabels.gallery,
      ),
      baseLabels.gallery,
    );

    const tocItems = sections.map((section) => ({
      href: `#${section.id}`,
      label: section.title,
    }));

    if (tips.length > 0) {
      tocItems.push({
        href: "#tips",
        label: resolveTocLabel(translate, fallbackTranslator, fallbackEn, translateString, "tips", tipsTitle),
      });
    }

    if (faqs.length > 0) {
      tocItems.push({
        href: "#faqs",
        label: resolveTocLabel(translate, fallbackTranslator, fallbackEn, translateString, "faqs", faqsTitle),
      });
    }

    if (galleryItems.length > 0) {
      tocItems.push({
        href: "#gallery",
        label: resolveTocLabel(translate, fallbackTranslator, fallbackEn, translateString, "gallery", baseLabels.gallery),
      });
    }

    const tocTitle = resolveTocLabel(
      translate,
      fallbackTranslator,
      fallbackEn,
      translateString,
      "onThisPage",
      baseLabels.onThisPage,
    );

    return {
      intro,
      sections,
      tips,
      tipsTitle,
      faqs,
      faqsTitle,
      galleryTitle,
      galleryItems,
      tocTitle,
      tocItems,
    } satisfies GuideExtras;
  };

const toNormalizedFaqEntries = (faqs: FerryFaq[]): NormalizedFaqEntry[] =>
  faqs.map(({ q, a }) => ({ question: q, answer: [...a] } satisfies NormalizedFaqEntry));

export const createGuideFaqFallback = () =>
  (targetLang: string): NormalizedFaqEntry[] => {
    const translator = getGuidesFallbackTranslator(targetLang);
    const fallbackEn = getGuidesFallbackTranslator("en");
    const faqs = toNormalizedFaqEntries(normaliseFaqs(translator(`${GUIDE_KEY}.faqs`, { returnObjects: true })));
    if (faqs.length > 0) return faqs;
    return toNormalizedFaqEntries(normaliseFaqs(fallbackEn(`${GUIDE_KEY}.faqs`, { returnObjects: true })));
  };
