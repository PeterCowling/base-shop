// src/routes/guides/cheapEatsInPositano/buildFaqContent.ts
import type { StructuredFaq } from "./constants";
import { normalizeText } from "./normalizeText";
import type { CheapEatsTranslationContext } from "./useCheapEatsTranslationContext";

export type CheapEatsFaqContent = {
  fallbackFaqs: StructuredFaq[];
  faqHeading: string;
  faqTocLabel: string;
  fallbackFaqLabel: string;
};

type BuildFaqContentParams = {
  context: CheapEatsTranslationContext;
  fallbackFaqs: StructuredFaq[];
  tocFaqLabel?: string;
};

export function buildFaqContent({
  context,
  fallbackFaqs,
  tocFaqLabel,
}: BuildFaqContentParams): CheapEatsFaqContent {
  const { t, normalizeEnglish, englishDefaults } = context;

  const fallbackFaqLabel =
    normalizeText(t("labels.faqsHeading"), "labels.faqsHeading") ??
    normalizeEnglish("labels.faqsHeading") ??
    englishDefaults.faqsHeading;

  const faqHeading = tocFaqLabel ?? fallbackFaqLabel;

  return {
    fallbackFaqs,
    faqHeading,
    faqTocLabel: faqHeading,
    fallbackFaqLabel,
  };
}
