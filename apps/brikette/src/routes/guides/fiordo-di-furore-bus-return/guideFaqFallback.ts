// src/routes/guides/fiordo-di-furore-bus-return/guideFaqFallback.ts
import type { TFunction } from "i18next";

import appI18n from "@/i18n";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

import { stripGuideLinkTokens } from "../utils/linkTokens";

import { GUIDE_KEY } from "./constants";

type Translator = TFunction<"guides">;

function getGuidesTranslator(locale: string): Translator {
  return appI18n.getFixedT(locale, "guides") as Translator;
}

function normaliseFaqs(value: unknown): NormalizedFaqEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const faqs: NormalizedFaqEntry[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const question = "q" in entry && typeof entry.q === "string" ? entry.q : null;
    const answersValue = "a" in entry ? entry.a : null;
    const answers = Array.isArray(answersValue)
      ? answersValue.filter((answer): answer is string => typeof answer === "string")
      : [];
    if (!question || answers.length === 0) {
      continue;
    }
    faqs.push({
      question: question.trim(),
      answer: answers.map((value) => value.trim()).filter((value) => value.length > 0),
    });
  }

  return faqs.filter((faq) => faq.question.length > 0 && faq.answer.length > 0);
}

function sanitiseFaqs(faqs: NormalizedFaqEntry[]): NormalizedFaqEntry[] {
  return faqs.map((faq) => ({
    question: faq.question,
    answer: faq.answer.map((answer) => stripGuideLinkTokens(answer)).filter((value) => value.length > 0),
  }));
}

function resolveFaqs(
  translator: Translator,
  fallback: Translator,
): NormalizedFaqEntry[] {
  const baseKey = `content.${GUIDE_KEY}`;
  const localizedFaqs = normaliseFaqs(
    translator(`${baseKey}.faqs`, { returnObjects: true }) as unknown,
  );
  if (localizedFaqs.length > 0) {
    return sanitiseFaqs(localizedFaqs);
  }

  const legacyLocalized = normaliseFaqs(
    translator(`${baseKey}.faq`, { returnObjects: true }) as unknown,
  );
  if (legacyLocalized.length > 0) {
    return sanitiseFaqs(legacyLocalized);
  }

  const fallbackFaqs = normaliseFaqs(
    fallback(`${baseKey}.faqs`, { returnObjects: true }) as unknown,
  );
  if (fallbackFaqs.length > 0) {
    return sanitiseFaqs(fallbackFaqs);
  }

  const legacyFallback = normaliseFaqs(
    fallback(`${baseKey}.faq`, { returnObjects: true }) as unknown,
  );
  if (legacyFallback.length > 0) {
    return sanitiseFaqs(legacyFallback);
  }

  return [];
}

export function createGuideFaqFallback(targetLang: string): NormalizedFaqEntry[] {
  const translator = getGuidesTranslator(targetLang);
  const fallback = getGuidesTranslator("en");
  return resolveFaqs(translator, fallback);
}
