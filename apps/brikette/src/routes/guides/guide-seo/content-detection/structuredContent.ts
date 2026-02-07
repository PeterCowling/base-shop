/**
 * Structured content detection utilities.
 *
 * Checks whether translator responses contain meaningful structured content.
 */
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import { isPlaceholderString } from "./placeholders";

interface StructuredContentParams {
  guideKey: string;
  guideIntroRaw: unknown;
  guideSectionsRaw: unknown;
  guideFaqsRaw: unknown;
}

/**
 * Check if intro array has meaningful content.
 */
function hasIntroContent(guideIntroRaw: unknown, guideKey: string): boolean {
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
  return false;
}

/**
 * Check if sections array has meaningful content.
 */
function hasSectionsContent(guideSectionsRaw: unknown, guideKey: string): boolean {
  try {
    const arr = ensureArray<{ title?: unknown; body?: unknown; items?: unknown; list?: unknown }>(guideSectionsRaw);
    return arr.some((s) => {
      if (Array.isArray(s)) {
        const body = ensureStringArray(s)
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.sections`));
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
        .filter((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.sections`));
      return hasTitle || bodyCandidates.length > 0;
    });
  } catch {
    /* noop */
  }
  return false;
}

/**
 * Check if FAQs array has meaningful content.
 */
function hasFaqsContent(guideFaqsRaw: unknown, guideKey: string): boolean {
  try {
    const faqs = ensureArray<{ q?: unknown; question?: unknown; a?: unknown; answer?: unknown }>(guideFaqsRaw);
    return faqs.some((faq) => {
      if (!faq || typeof faq !== "object") return false;
      const questionSource =
        typeof faq.q === "string" ? faq.q : typeof faq.question === "string" ? faq.question : "";
      const question = questionSource.trim();
      if (question.length === 0 || isPlaceholderString(question, `content.${guideKey}.faqs`)) {
        return false;
      }
      const answers = ensureStringArray(faq.a ?? faq.answer);
      return answers.length > 0;
    });
  } catch {
    /* noop */
  }
  return false;
}

/**
 * Check if the translator has any meaningful structured content (intro, sections, or FAQs).
 */
export function checkTranslatorHasStructuredContent({
  guideKey,
  guideIntroRaw,
  guideSectionsRaw,
  guideFaqsRaw,
}: StructuredContentParams): boolean {
  if (hasIntroContent(guideIntroRaw, guideKey)) return true;
  if (hasSectionsContent(guideSectionsRaw, guideKey)) return true;
  if (hasFaqsContent(guideFaqsRaw, guideKey)) return true;
  return false;
}

/**
 * Check if translator returned arrays but they were empty (no meaningful content).
 */
export function checkTranslatorProvidedEmptyStructured(
  guideIntroRaw: unknown,
  guideSectionsRaw: unknown,
  guideFaqsRaw: unknown,
  translatorHasStructuredContent: boolean,
): boolean {
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
}
