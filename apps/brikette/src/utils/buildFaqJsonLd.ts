// src/utils/buildFaqJsonLd.ts
// Utilities for building FAQPage JSON-LD payloads from translation content.

import { stripGuideMarkup } from "@/routes/guides/utils/linkTokens";

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

export type FaqJsonLd = {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  inLanguage: string;
  url: string;
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
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
): FaqJsonLd | null {
  // Emit nothing when there are no entries to avoid empty FAQPage payloads.
  // Consumers use an empty string as a signal to skip injecting a <script> tag.
  const safeEntries = Array.isArray(entries) ? entries : [];
  if (safeEntries.length === 0) {
    return null;
  }

  const sanitized = safeEntries
    .map((entry) => {
      const question = stripGuideMarkup(entry.question).trim();
      const answer = entry.answer
        .map((value) => stripGuideMarkup(value).trim())
        .filter((value) => value.length > 0);
      if (question.length === 0 || answer.length === 0) return null;
      return { question, answer };
    })
    .filter((value): value is { question: string; answer: string[] } => value !== null);

  if (sanitized.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    url,
    mainEntity: sanitized.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer.join("\n\n"),
      },
    })),
  };
}

export function buildFaqJsonLd(lang: string, url: string, raw: unknown): FaqJsonLd | null {
  return faqEntriesToJsonLd(lang, url, normalizeFaqEntries(raw));
}
