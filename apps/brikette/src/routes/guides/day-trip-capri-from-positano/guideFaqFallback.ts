// src/routes/guides/day-trip-capri-from-positano/guideFaqFallback.ts
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

import { stripGuideLinkTokens } from "../utils/linkTokens";

import { GUIDE_KEY } from "./constants";
import { getGuidesTranslator } from "./i18n";
import { toFaqEntries } from "./transformers";
import type { GuideFaq } from "./types";

function sanitizeFaqs(faqs: GuideFaq[]): GuideFaq[] {
  return faqs.map(({ q, a }) => ({ q, a: a.map((answer) => stripGuideLinkTokens(answer)) }));
}

function toNormalizedFaqs(faqs: GuideFaq[]): NormalizedFaqEntry[] {
  return faqs.map(({ q, a }) => ({ question: q, answer: [...a] }));
}

export function createGuideFaqFallback(targetLang: string): NormalizedFaqEntry[] {
  const translator = getGuidesTranslator(targetLang);
  const fallback = getGuidesTranslator("en");

  const localized = toNormalizedFaqs(
    sanitizeFaqs(toFaqEntries(translator(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }))),
  );
  if (localized.length > 0) return localized;

  const fallbackFaqs = toNormalizedFaqs(
    sanitizeFaqs(toFaqEntries(fallback(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }))),
  );
  if (fallbackFaqs.length > 0) return fallbackFaqs;

  return [];
}
