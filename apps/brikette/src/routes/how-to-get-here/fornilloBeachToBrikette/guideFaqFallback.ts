import { type NormalizedFaqEntry,normalizeFaqEntries } from "@/utils/buildFaqJsonLd";

import { GUIDE_KEY } from "./constants";
import { getGuidesFallbackTranslator } from "./i18n";

export function resolveGuideFaqFallback(targetLang: string): NormalizedFaqEntry[] {
  const translator = getGuidesFallbackTranslator(targetLang);
  const fallbackEn = getGuidesFallbackTranslator("en");
  const faqs = normalizeFaqEntries(translator(`${GUIDE_KEY}.faqs`, { returnObjects: true }));
  if (faqs.length > 0) return faqs;
  const legacy = normalizeFaqEntries(translator(`${GUIDE_KEY}.faq`, { returnObjects: true }));
  if (legacy.length > 0) return legacy;
  return normalizeFaqEntries(fallbackEn(`${GUIDE_KEY}.faqs`, { returnObjects: true }));
}

