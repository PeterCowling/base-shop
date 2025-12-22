// src/utils/buildFaqJsonLd.ts
// Utilities for building FAQPage JSON-LD payloads from translation content.

import { ensureArray, ensureStringArray } from "./i18nContent";

export type RawFaqEntry = {
  q?: unknown;
  question?: unknown;
  a?: unknown;
  answer?: unknown;
};

export type NormalizedFaqEntry = {
  question: string;
  answer: string[];
};

export function normalizeFaqEntries(raw: unknown): NormalizedFaqEntry[] {
  return ensureArray<RawFaqEntry>(raw)
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const questionSource = entry.q ?? entry.question;
      const question = questionSource == null ? "" : String(questionSource).trim();
      const answer = ensureStringArray(entry.a ?? entry.answer)
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      if (question.length === 0 || answer.length === 0) {
        return null;
      }

      return { question, answer } satisfies NormalizedFaqEntry;
    })
    .filter((value): value is NormalizedFaqEntry => value !== null);
}

export function faqEntriesToJsonLd(
  lang: string,
  url: string,
  entries: NormalizedFaqEntry[]
): string {
  // Emit nothing when there are no entries to avoid empty FAQPage payloads.
  // Consumers use an empty string as a signal to skip injecting a <script> tag.
  const safeEntries = Array.isArray(entries) ? entries : [];
  if (safeEntries.length === 0) {
    return "";
  }
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    url,
    mainEntity: safeEntries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer.join("\n\n"),
      },
    })),
  });
}

export function buildFaqJsonLd(lang: string, url: string, raw: unknown): string {
  return faqEntriesToJsonLd(lang, url, normalizeFaqEntries(raw));
}
