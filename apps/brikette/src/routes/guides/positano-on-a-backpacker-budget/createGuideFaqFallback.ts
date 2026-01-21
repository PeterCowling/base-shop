// src/routes/guides/positano-on-a-backpacker-budget/createGuideFaqFallback.ts
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

import { stripGuideLinkTokens } from "../utils/linkTokens";

import { GUIDE_KEY } from "./constants";
import { getFaqItemsWithFallback, getGuidesTranslator } from "./translations";

export function createGuideFaqFallback(targetLang: string): NormalizedFaqEntry[] {
  const translator = getGuidesTranslator(targetLang);
  const fallback = getGuidesTranslator("en");
  const baseKey = `content.${GUIDE_KEY}`;
  const faqs = getFaqItemsWithFallback(translator, fallback, {
    current: `${baseKey}.faqs`,
    legacy: `${baseKey}.faq`,
  });

  return faqs
    .map(({ q, a }) => {
      const question = q.trim();
      const answer = a
        .map((raw) => stripGuideLinkTokens(raw).trim())
        .filter((entry) => entry.length > 0);
      if (!question || answer.length === 0) {
        return null;
      }
      return { question, answer } satisfies NormalizedFaqEntry;
    })
    .filter((entry): entry is NormalizedFaqEntry => entry != null);
}
