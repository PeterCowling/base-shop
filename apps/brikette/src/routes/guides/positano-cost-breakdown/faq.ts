import type { TFunction } from "i18next";

import { GUIDE_KEY } from "./constants";
import { normaliseFaqs } from "./normalisers";
import type { FaqItem } from "./types";

export function getFaqItemsWithFallback(
  primary: TFunction<"guides">,
  fallback: TFunction<"guides">
): FaqItem[] {
  const primaryFaqs = normaliseFaqs(primary(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }));
  if (primaryFaqs.length > 0) {
    return primaryFaqs;
  }

  const legacyPrimary = normaliseFaqs(primary(`content.${GUIDE_KEY}.faq`, { returnObjects: true }));
  if (legacyPrimary.length > 0) {
    return legacyPrimary;
  }

  const fallbackFaqs = normaliseFaqs(fallback(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }));
  if (fallbackFaqs.length > 0) {
    return fallbackFaqs;
  }

  return normaliseFaqs(fallback(`content.${GUIDE_KEY}.faq`, { returnObjects: true }));
}
