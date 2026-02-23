import { unifyNormalizedFaqEntries } from "@/utils/seo/jsonld";

import type { Translator } from "../../../types";
import type { FallbackTranslator } from "../../../utils/fallbacks";

function readFaqEntries(
  translator: FallbackTranslator | undefined,
  key: string,
): Array<{ question: string; answer: string[] }> {
  return unifyNormalizedFaqEntries(translator?.(key, { returnObjects: true }) as unknown);
}

function readFaqHeading(
  translator: FallbackTranslator | undefined,
  key: string,
): string | undefined {
  try {
    const raw = translator?.(key) as unknown;
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    return trimmed && trimmed !== key ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

export function resolveFallbackFaqs(
  tFb: FallbackTranslator | undefined,
  guideKey: string,
  legacyKey: string,
): Array<{ question: string; answer: string[] }> {
  try {
    const candidates = [
      `content.${guideKey}.faqs`,
      `content.${guideKey}.faq`,
      `${guideKey}.faqs`,
      `${guideKey}.faq`,
      `content.${legacyKey}.faqs`,
      `${legacyKey}.faqs`,
    ];
    for (const key of candidates) {
      const entries = readFaqEntries(tFb, key);
      if (entries.length > 0) return entries;
    }
    return [];
  } catch {
    // Fallback to empty array if translator throws (unsupported ns/lang)
    return [];
  }
}

export function resolveFaqHeading(
  tFb: FallbackTranslator | undefined,
  t: Translator,
  guideKey: string,
  legacyKey: string,
  aliasKey: string | null | undefined,
  mergeAliasFaqs: boolean,
): string {
  const keys = [`content.${guideKey}.faqsTitle`, `${guideKey}.faqsTitle`];
  if (aliasKey && mergeAliasFaqs) {
    keys.push(`content.${aliasKey}.faqsTitle`, `${aliasKey}.faqsTitle`);
  }
  keys.push(`content.${legacyKey}.faqsTitle`, `${legacyKey}.faqsTitle`);

  for (const key of keys) {
    const heading = readFaqHeading(tFb, key);
    if (heading) return heading;
  }

  return t("labels.faqsHeading", { defaultValue: "FAQs" }) as string;
}
