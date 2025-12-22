import { ensureStringArray } from "@/utils/i18nContent";

import { stripGuideLinkTokens } from "../utils/linkTokens";
import { getGuidesTranslator } from "./translator";
import { getFaqItemsWithFallback } from "./faq";
import type { FaqItem } from "./types";

export function buildGuideFaqFallback(targetLang: string): FaqItem[] {
  const translator = getGuidesTranslator(targetLang);
  const fallback = getGuidesTranslator("en");
  const faqs = getFaqItemsWithFallback(translator, fallback);

  return faqs.map(({ q, a }) => ({
    q,
    a: ensureStringArray(a).map((answer) =>
      stripGuideLinkTokens(answer)
        .replace(/<[^>]+>/g, "")
        .trim(),
    ),
  }));
}
