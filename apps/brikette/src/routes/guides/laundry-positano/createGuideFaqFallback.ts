// src/routes/guides/laundry-positano/createGuideFaqFallback.ts
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

import { stripGuideLinkTokens } from "../utils/linkTokens";

import { GUIDE_KEY } from "./constants";
import { getGuidesTranslator, normaliseFaqs } from "./faq";

function toNormalized(entries: readonly { q: string; a: string[] }[]): NormalizedFaqEntry[] {
  return entries.map(({ q, a }) => ({
    question: q,
    answer: a.map(stripGuideLinkTokens),
  }));
}

export function createGuideFaqFallback(targetLang: string): NormalizedFaqEntry[] {
  const translator = getGuidesTranslator(targetLang);
  const fallback = getGuidesTranslator("en");
  const faqs = normaliseFaqs(translator(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }));
  if (faqs.length > 0) return toNormalized(faqs);
  const legacyLocal = normaliseFaqs(translator(`content.${GUIDE_KEY}.faq`, { returnObjects: true }));
  if (legacyLocal.length > 0) return toNormalized(legacyLocal);
  const fallbackFaqs = normaliseFaqs(fallback(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }));
  if (fallbackFaqs.length > 0) return toNormalized(fallbackFaqs);
  const legacy = normaliseFaqs(fallback(`content.${GUIDE_KEY}.faq`, { returnObjects: true }));
  if (legacy.length > 0) return toNormalized(legacy);
  return [];
}
