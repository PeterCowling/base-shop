/**
 * FAQ normalization utilities.
 */
import { ensureStringArray } from "@/utils/i18nContent";

import type { NormalisedFaq } from "../types";

import { isPlaceholderString } from "../content-detection/placeholders";

/**
 * Flatten nested FAQ entries into a flat array.
 */
function flattenFaqEntries(
  input: unknown,
): Array<{ q?: unknown; question?: unknown; a?: unknown; answer?: unknown }> {
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
}

/**
 * Normalize raw FAQ data into NormalisedFaq array.
 */
export function normalizeFaqs(value: unknown, guideKey: string): NormalisedFaq[] {
  const placeholderKey = `content.${guideKey}.faqs` as const;
  const seen = new Set<string>();

  return flattenFaqEntries(value)
    .map((faq) => {
      if (!faq || typeof faq !== "object") return null;

      const questionSource =
        typeof faq.q === "string" ? faq.q : typeof faq.question === "string" ? faq.question : "";
      const question = questionSource.trim();

      if (!question || isPlaceholderString(question, placeholderKey)) return null;

      const answerSource = faq.a ?? faq.answer;
      const answer = ensureStringArray(answerSource)
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => entry.length > 0 && !isPlaceholderString(entry, placeholderKey));

      if (answer.length === 0) return null;

      // Deduplicate by question + answer combination
      const dedupeKey = `${question.toLowerCase()}__${answer.map((entry) => entry.toLowerCase()).join("\u0000")}`;
      if (seen.has(dedupeKey)) return null;
      seen.add(dedupeKey);

      return { q: question, a: answer } satisfies NormalisedFaq;
    })
    .filter((faq): faq is NormalisedFaq => Boolean(faq && faq.q.length > 0));
}
