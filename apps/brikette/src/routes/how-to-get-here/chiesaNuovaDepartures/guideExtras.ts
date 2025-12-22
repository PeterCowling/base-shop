import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import { ensureStringArray } from "@/utils/i18nContent";

import { GUIDE_KEY, STOP_IMAGE_SRC } from "./constants";
import { normaliseFaqs, normaliseSections, normaliseTocItems } from "./content";
import {
  buildGuideFallbackLabels,
  buildTranslationKey,
  getGuidesFallbackTranslator,
} from "./i18n";
import type { GuideExtras, TocEntry } from "./types";

export function createGuideExtras(context: GuideSeoTemplateContext): GuideExtras {
  const translate = context.translateGuides;
  const rawTranslate = context.translator;
  const guidesFallbackLocal = getGuidesFallbackTranslator(context.lang);
  const guidesFallbackEn = getGuidesFallbackTranslator("en");
  const fallbackLabels = buildGuideFallbackLabels(guidesFallbackLocal, guidesFallbackEn);

  const coerceString = (value: unknown) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const readArray = <T,>(
    suffix: string,
    normaliser: (value: unknown) => T[],
    options?: { skipEnglishFallback?: boolean },
  ): T[] => {
    const { skipEnglishFallback = false } = options ?? {};
    const primary = normaliser(translate(buildTranslationKey(suffix), { returnObjects: true }));
    if (primary.length > 0) return primary;
    const fallbackLocal = normaliser(guidesFallbackLocal(`${GUIDE_KEY}.${suffix}`, { returnObjects: true }));
    if (fallbackLocal.length > 0) return fallbackLocal;
    if (skipEnglishFallback) return [];
    return normaliser(guidesFallbackEn(`${GUIDE_KEY}.${suffix}`, { returnObjects: true }));
  };

  const readString = (suffix: string, options?: { allowBlank?: boolean }): string | undefined => {
    const { allowBlank = false } = options ?? {};
    const translationKey = buildTranslationKey(suffix);
    const consume = (input: unknown) => {
      if (typeof input !== "string") return undefined;
      if (input === translationKey) return undefined;
      const trimmed = input.trim();
      if (trimmed.length > 0) return trimmed;
      if (allowBlank && input === "") return "";
      return undefined;
    };

    const rawValue = rawTranslate(translationKey);
    const primaryRaw = consume(rawValue);
    if (primaryRaw !== undefined) return primaryRaw;

    const fallbackLocal = consume(guidesFallbackLocal(`${GUIDE_KEY}.${suffix}`, { defaultValue: "" }));
    if (fallbackLocal !== undefined) return fallbackLocal;

    const primary = consume(translate(translationKey));
    if (primary !== undefined) return primary;

    const fallbackEn = consume(guidesFallbackEn(`${GUIDE_KEY}.${suffix}`, { defaultValue: "" }));
    if (fallbackEn !== undefined) return fallbackEn;

    return undefined;
  };

  const intro = readArray("intro", ensureStringArray);
  const sections = readArray("sections", normaliseSections);
  const beforeList = readArray("beforeList", ensureStringArray);
  const stepsList = readArray("stepsList", ensureStringArray);
  const stepsMapEmbedUrl = readString("stepsMapEmbedUrl");
  const kneesList = readArray("kneesList", ensureStringArray);
  const kneesDockPrefix = readString("kneesDockPrefix", { allowBlank: true });
  const kneesDockLinkText = readString("kneesDockLinkLabel", { allowBlank: true });
  const kneesPorterPrefix = readString("kneesPorterPrefix", { allowBlank: true });
  const kneesPorterLinkText = readString("kneesPorterLinkLabel", { allowBlank: true });
  const imageAlt = readString("image.alt");
  const imageCaption = readString("image.caption");
  let faqs = readArray("faqs", normaliseFaqs, { skipEnglishFallback: true });
  if (faqs.length === 0) {
    const legacyFaq = readArray("faq", normaliseFaqs, { skipEnglishFallback: true });
    if (legacyFaq.length > 0) {
      faqs = legacyFaq;
    } else {
      const fallbackFaqs = normaliseFaqs(guidesFallbackEn(`${GUIDE_KEY}.faqs`, { returnObjects: true }));
      faqs = fallbackFaqs.length > 0 ? fallbackFaqs : normaliseFaqs(guidesFallbackEn(`${GUIDE_KEY}.faq`, { returnObjects: true }));
    }
  }

  const faqsTitle =
    readString("faqsTitle") ??
    coerceString(guidesFallbackLocal(`${GUIDE_KEY}.faqsTitle`, { defaultValue: "" })) ??
    coerceString(guidesFallbackEn(`${GUIDE_KEY}.faqsTitle`, { defaultValue: "" }));

  const howToSteps = readArray("howtoSteps", ensureStringArray);

  const tocTitle = readString("toc.onThisPage") ?? readString("tocTitle") ?? fallbackLabels.onThisPage;

  const explicitTocItems = normaliseTocItems(
    translate(buildTranslationKey("tocItems"), { returnObjects: true }),
  );
  const fallbackTocItems =
    explicitTocItems.length > 0
      ? explicitTocItems
      : normaliseTocItems(guidesFallbackLocal(`${GUIDE_KEY}.tocItems`, { returnObjects: true }));
  const fallbackEnTocItems =
    fallbackTocItems.length > 0
      ? fallbackTocItems
      : normaliseTocItems(guidesFallbackEn(`${GUIDE_KEY}.tocItems`, { returnObjects: true }));

  const tocItemsCandidates: TocEntry[] = [];
  const pushItem = (item: TocEntry | null | undefined) => {
    if (!item) return;
    if (tocItemsCandidates.some((candidate) => candidate.href === item.href)) return;
    tocItemsCandidates.push(item);
  };

  sections.forEach((section) => {
    pushItem({ href: `#${section.id}`, label: section.title });
  });
  if (beforeList.length > 0) {
    pushItem({ href: "#before", label: readString("toc.before") ?? fallbackLabels.before });
  }
  if (stepsList.length > 0) {
    pushItem({ href: "#steps", label: readString("toc.steps") ?? fallbackLabels.steps });
  }
  const shouldRenderKnees =
    kneesList.length > 0 ||
    (kneesDockPrefix && kneesDockLinkText) ||
    (kneesPorterPrefix && kneesPorterLinkText);
  if (shouldRenderKnees) {
    pushItem({ href: "#knees", label: readString("toc.knees") ?? fallbackLabels.knees });
  }
  if (faqs.length > 0) {
    pushItem({ href: "#faqs", label: readString("toc.faqs") ?? faqsTitle ?? fallbackLabels.faqs });
  }

  const tocItems =
    explicitTocItems.length > 0
      ? explicitTocItems
      : fallbackTocItems.length > 0
        ? fallbackTocItems
        : fallbackEnTocItems.length > 0
          ? fallbackEnTocItems
          : tocItemsCandidates;

  return {
    intro,
    sections,
    beforeList,
    stepsList,
    kneesList,
    faqs,
    faqsTitle: faqsTitle ?? fallbackLabels.faqs,
    tocTitle,
    tocItems,
    howToSteps,
    labels: fallbackLabels,
    ...(imageAlt
      ? {
          image: {
            src: STOP_IMAGE_SRC,
            alt: imageAlt,
            ...(imageCaption !== undefined ? { caption: imageCaption } : {}),
          },
        }
      : {}),
    ...(stepsMapEmbedUrl !== undefined ? { stepsMapEmbedUrl } : {}),
    ...(kneesDockPrefix !== undefined ? { kneesDockPrefix } : {}),
    ...(kneesDockLinkText !== undefined ? { kneesDockLinkText } : {}),
    ...(kneesPorterPrefix !== undefined ? { kneesPorterPrefix } : {}),
    ...(kneesPorterLinkText !== undefined ? { kneesPorterLinkText } : {}),
  } satisfies GuideExtras;
}
