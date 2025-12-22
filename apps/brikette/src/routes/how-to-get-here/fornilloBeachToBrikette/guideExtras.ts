import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import { ensureStringArray } from "@/utils/i18nContent";

import { GUIDE_KEY } from "./constants";
import { normaliseFaqs, normaliseSections, normaliseToc } from "./content";
import {
  buildGuideFallbackLabels,
  buildTranslationKey,
  getGuidesFallbackTranslator,
} from "./i18n";
import type { GuideExtras } from "./types";

export function createGuideExtras(context: GuideSeoTemplateContext): GuideExtras {
  const translate = context.translateGuides;
  const guidesFallbackLocal = getGuidesFallbackTranslator(context.lang);
  const guidesFallbackEn = getGuidesFallbackTranslator("en");
  const fallbackLabels = buildGuideFallbackLabels(guidesFallbackLocal, guidesFallbackEn);

  const readArray = <T,>(suffix: string, normaliser: (value: unknown) => T[]): T[] => {
    const primary = normaliser(translate(buildTranslationKey(suffix), { returnObjects: true }));
    if (primary.length > 0) return primary;
    const fallbackLocal = normaliser(guidesFallbackLocal(`${GUIDE_KEY}.${suffix}`, { returnObjects: true }));
    if (fallbackLocal.length > 0) return fallbackLocal;
    return normaliser(guidesFallbackEn(`${GUIDE_KEY}.${suffix}`, { returnObjects: true }));
  };

  const readString = (suffix: string): string | undefined => {
    const translationKey = buildTranslationKey(suffix);
    const value = translate(translationKey);
    if (typeof value === "string" && value.trim().length > 0 && value !== translationKey) {
      return value.trim();
    }
    const fallbackLocal = guidesFallbackLocal(`${GUIDE_KEY}.${suffix}`, { defaultValue: "" });
    if (typeof fallbackLocal === "string" && fallbackLocal.trim().length > 0) {
      return fallbackLocal.trim();
    }
    const fallbackEn = guidesFallbackEn(`${GUIDE_KEY}.${suffix}`, { defaultValue: "" });
    if (typeof fallbackEn === "string" && fallbackEn.trim().length > 0) {
      return fallbackEn.trim();
    }
    return undefined;
  };

  const intro = readArray("intro", ensureStringArray);
  const sections = readArray("sections", normaliseSections);
  const beforeList = readArray("beforeList", ensureStringArray);
  const stepsList = readArray("stepsList", ensureStringArray);
  const kneesList = readArray("kneesList", ensureStringArray);
  const kneesDockPrefix = readString("kneesDockPrefix");
  const kneesDockLinkText = readString("kneesDockLinkLabel");
  const kneesPorterPrefix = readString("kneesPorterPrefix");
  const kneesPorterLinkText = readString("kneesPorterLinkLabel");
  const faqs = readArray("faqs", normaliseFaqs);

  if (faqs.length === 0) {
    const legacyFaq = normaliseFaqs(translate(buildTranslationKey("faq"), { returnObjects: true }));
    if (legacyFaq.length > 0) {
      faqs.push(...legacyFaq);
    }
  }

  const faqsTitleFallbackRaw = guidesFallbackEn(`${GUIDE_KEY}.faqsTitle`, { defaultValue: "" });
  const faqsTitleFallback =
    typeof faqsTitleFallbackRaw === "string" && faqsTitleFallbackRaw.trim().length > 0
      ? faqsTitleFallbackRaw.trim()
      : fallbackLabels.faqs;
  const faqsTitle = readString("faqsTitle") ?? faqsTitleFallback;

  const explicitToc = normaliseToc(translate(buildTranslationKey("toc"), { returnObjects: true }));
  const fallbackToc =
    explicitToc.length > 0
      ? explicitToc
      : normaliseToc(guidesFallbackLocal(`${GUIDE_KEY}.toc`, { returnObjects: true }));
  const fallbackEnToc =
    fallbackToc.length > 0
      ? fallbackToc
      : normaliseToc(guidesFallbackEn(`${GUIDE_KEY}.toc`, { returnObjects: true }));

  const tocItems: GuideExtras["tocItems"] = [];
  const pushItem = (item: GuideExtras["tocItems"][number] | null | undefined) => {
    if (!item) return;
    if (tocItems.some((existing) => existing.href === item.href)) return;
    tocItems.push(item);
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

  const finalToc =
    explicitToc.length > 0
      ? explicitToc
      : fallbackToc.length > 0
        ? fallbackToc
        : fallbackEnToc.length > 0
          ? fallbackEnToc
          : tocItems;

  const howToSteps = readArray("howtoSteps", ensureStringArray);
  if (howToSteps.length === 0 && stepsList.length > 0) {
    howToSteps.push(...stepsList);
  }

  return {
    intro,
    sections,
    tocItems: finalToc,
    tocTitle: readString("tocTitle") ?? fallbackLabels.onThisPage,
    beforeList,
    stepsList,
    kneesList,
    faqs,
    faqsTitle: faqsTitle ?? fallbackLabels.faqs,
    howToSteps,
    labels: fallbackLabels,
    ...(kneesDockPrefix !== undefined ? { kneesDockPrefix } : {}),
    ...(kneesDockLinkText !== undefined ? { kneesDockLinkText } : {}),
    ...(kneesPorterPrefix !== undefined ? { kneesPorterPrefix } : {}),
    ...(kneesPorterLinkText !== undefined ? { kneesPorterLinkText } : {}),
  };
}
