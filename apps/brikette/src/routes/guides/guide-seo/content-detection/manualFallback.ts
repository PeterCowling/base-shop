/**
 * Manual fallback content detection.
 *
 * Checks whether a guide has meaningful manual fallback content defined.
 */
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

/**
 * Check if the manual fallback object has meaningful content.
 */
export function checkHasManualFallback(guideManualFallbackRaw: unknown): boolean {
  if (!guideManualFallbackRaw || typeof guideManualFallbackRaw !== "object") {
    return false;
  }
  if (Array.isArray(guideManualFallbackRaw)) {
    return false;
  }

  const fallback = guideManualFallbackRaw as Record<string, unknown>;

  // Check intro
  const intro = ensureStringArray(fallback["intro"]);
  if (intro.length > 0) return true;

  // Check sections
  const sectionsMeaningful = ensureArray<{ id?: string; title?: string; body?: unknown; items?: unknown }>(
    fallback["sections"],
  ).some((section) => {
    if (!section || typeof section !== "object") return false;
    const title = typeof section.title === "string" ? section.title.trim() : "";
    const body = ensureStringArray(section.body ?? section.items);
    return title.length > 0 || body.length > 0;
  });
  if (sectionsMeaningful) return true;

  // Check FAQs
  const faqsMeaningful = ensureArray<{ q?: string; a?: unknown; answer?: unknown }>(fallback["faqs"]).some((faq) => {
    if (!faq || typeof faq !== "object") return false;
    const question = typeof faq.q === "string" ? faq.q.trim() : "";
    const answer = ensureStringArray(faq.a ?? faq.answer);
    return question.length > 0 && answer.length > 0;
  });
  if (faqsMeaningful) return true;

  // Check ToC
  const tocMeaningful = ensureArray<{ href?: string; label?: string }>(fallback["toc"]).some((entry) => {
    const href = typeof entry?.href === "string" ? entry.href.trim() : "";
    const label = typeof entry?.label === "string" ? entry.label.trim() : "";
    return href.length > 0 && label.length > 0;
  });
  if (tocMeaningful) return true;

  // Check FAQ/ToC titles
  const faqTitle = typeof fallback["faqsTitle"] === "string" ? fallback["faqsTitle"].trim() : "";
  if (faqTitle.length > 0) return true;

  const tocTitle = typeof fallback["tocTitle"] === "string" ? fallback["tocTitle"].trim() : "";
  if (tocTitle.length > 0) return true;

  return false;
}
