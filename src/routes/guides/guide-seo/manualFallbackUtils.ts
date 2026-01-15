import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

interface ManualSectionCandidate {
  id?: string | number;
  title?: unknown;
  heading?: unknown;
  body?: unknown;
  items?: unknown;
}

interface ManualFaqCandidate {
  q?: unknown;
  question?: unknown;
  a?: unknown;
  answer?: unknown;
}

interface ManualTocCandidate {
  href?: unknown;
  label?: unknown;
}

const hasMeaningfulString = (value: unknown): boolean =>
  typeof value === "string" && value.trim().length > 0;

export const manualFallbackHasMeaningfulContent = (candidate: unknown): boolean => {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  const fallback = candidate as Record<string, unknown>;

  if (ensureStringArray(fallback.intro).some((entry) => entry.trim().length > 0)) {
    return true;
  }

  const sectionsMeaningful = ensureArray<ManualSectionCandidate>(fallback.sections).some((section) => {
    if (!section || typeof section !== "object") return false;
    const titleRaw = section.title ?? section.heading;
    const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
    const body = ensureStringArray(section.body ?? section.items);
    return title.length > 0 || body.length > 0;
  });
  if (sectionsMeaningful) return true;

  const faqsMeaningful = ensureArray<ManualFaqCandidate>(fallback.faqs).some((faq) => {
    if (!faq || typeof faq !== "object") return false;
    const questionSource =
      typeof faq.q === "string" ? faq.q : typeof faq.question === "string" ? faq.question : "";
    const question = questionSource.trim();
    const answer = ensureStringArray(faq.a ?? faq.answer);
    return question.length > 0 && answer.length > 0;
  });
  if (faqsMeaningful) return true;

  const tocMeaningful = ensureArray<ManualTocCandidate>(fallback.toc).some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const label = hasMeaningfulString(entry.label) ? (entry.label as string).trim() : "";
    const href = hasMeaningfulString(entry.href) ? (entry.href as string).trim() : "";
    return label.length > 0 || href.length > 0;
  });
  if (tocMeaningful) return true;

  const legacyFaqBlock = fallback.faq;
  if (legacyFaqBlock && typeof legacyFaqBlock === "object") {
    const summaryValue = (legacyFaqBlock as Record<string, unknown>).summary;
    const summary = typeof summaryValue === "string" ? summaryValue.trim() : "";
    if (summary.length > 0) return true;
    const answerValue = (legacyFaqBlock as Record<string, unknown>).answer;
    const answer = ensureStringArray(answerValue);
    if (answer.length > 0) return true;
  }

  if (hasMeaningfulString(fallback.faqsTitle) || hasMeaningfulString(fallback.tocTitle)) {
    return true;
  }

  return false;
};