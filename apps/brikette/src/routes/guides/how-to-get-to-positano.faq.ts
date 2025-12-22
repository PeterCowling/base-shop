// src/routes/guides/how-to-get-to-positano.faq.ts
import type { TFunction } from "i18next";
import { stripGuideLinkTokens } from "./utils/linkTokens";
import { GUIDE_KEY } from "./how-to-get-to-positano.constants";
import { normaliseFaqs } from "./how-to-get-to-positano.normalizers";
import type { GuideFaq } from "./how-to-get-to-positano.types";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";
import { getGuidesTranslator } from "./how-to-get-to-positano.translators";

const sanitizeFaqs = (faqs: GuideFaq[]): NormalizedFaqEntry[] =>
  faqs.map(({ q, a }) => ({
    question: q,
    answer: a.map((answer) => stripGuideLinkTokens(answer)),
  }));

const GUIDE_KEY_CANDIDATES = [GUIDE_KEY, "reachBudget"] as const;

function resolveFaqs(
  translate: TFunction<"guides">,
  suffix: "faq" | "faqs",
): NormalizedFaqEntry[] {
  for (const key of GUIDE_KEY_CANDIDATES) {
    const result = translate(`content.${key}.${suffix}`, { returnObjects: true });
    const faqs = sanitizeFaqs(normaliseFaqs(result));
    if (faqs.length > 0) return faqs;
  }
  return [];
}

export function buildGuideFaqFallback(targetLang: string): NormalizedFaqEntry[] {
  const translator = getGuidesTranslator(targetLang);
  const fallback = getGuidesTranslator("en");

  const faqs = resolveFaqs(translator, "faqs");
  if (faqs.length > 0) return faqs;

  const legacy = resolveFaqs(translator, "faq");
  if (legacy.length > 0) return legacy;

  const fallbackFaqs = resolveFaqs(fallback, "faqs");
  if (fallbackFaqs.length > 0) return fallbackFaqs;

  return resolveFaqs(fallback, "faq");
}

export { GUIDE_KEY, GUIDE_SLUG } from "./how-to-get-to-positano.constants";
