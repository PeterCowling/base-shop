import i18n from "@/i18n";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";
import { toAppLanguage } from "@/utils/lang";

import { stripGuideLinkTokens } from "../utils/linkTokens";

import { createFallbackData } from "./fallbackData";
import { getGuidesTranslator } from "./i18n";

export function createGuideFaqFallback(targetLang: string): NormalizedFaqEntry[] {
  const lang = toAppLanguage(targetLang);
  const translator = getGuidesTranslator(lang);
  const fallbackData = createFallbackData(lang);

  // If the active locale explicitly defines an empty fallback FAQ list
  // (content.positanoTravelGuide.fallback.faqs = []), respect that signal and
  // return no FAQ entries rather than falling back to English defaults.
  try {
    // First, inspect the raw resource store to avoid any implicit EN fallbacks
    // that a translator might apply for missing keys.
    const store = (i18n as unknown as { store?: { data?: Record<string, unknown> } })?.store?.data;
    const fallbackNode = (() => {
      const langNode = store?.[lang];
      if (!langNode || typeof langNode !== "object" || Array.isArray(langNode)) {
        return undefined;
      }
      const guidesNode = (langNode as { guides?: unknown }).guides;
      if (!guidesNode || typeof guidesNode !== "object" || Array.isArray(guidesNode)) {
        return undefined;
      }
      const contentNode = (guidesNode as { content?: unknown }).content;
      if (!contentNode || typeof contentNode !== "object" || Array.isArray(contentNode)) {
        return undefined;
      }
      const guideNode = (contentNode as { positanoTravelGuide?: unknown }).positanoTravelGuide;
      if (!guideNode || typeof guideNode !== "object" || Array.isArray(guideNode)) {
        return undefined;
      }
      const fallback = (guideNode as { fallback?: unknown }).fallback;
      if (!fallback || typeof fallback !== "object" || Array.isArray(fallback)) {
        return undefined;
      }
      return fallback as { faqs?: unknown };
    })();
    const storeFaqs = Array.isArray(fallbackNode?.faqs) ? (fallbackNode.faqs as unknown[]) : undefined;
    if (Array.isArray(storeFaqs) && storeFaqs.length === 0) {
      return [];
    }

    // Probe resource store directly to avoid implicit EN fallback from translator
    const getRes = (lng: string, key: string) =>
      (i18n as unknown as { getResource?: (lng: string, ns: string, key: string) => unknown })
        ?.getResource?.(lng, "guides", key);

    const faqsLocal = getRes(lang, "content.positanoTravelGuide.fallback.faqs");
    if (Array.isArray(faqsLocal)) {
      // Explicit signal present for this locale
      if (faqsLocal.length === 0) return [];
      // If locale explicitly provides non-empty fallback FAQs, prefer them below
    } else {
      // If the fallback object exists but explicitly sets faqs: [] at object level,
      // honour that as well without invoking the translator (which may fall back to EN).
      const obj = getRes(lang, "content.positanoTravelGuide.fallback");
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        const v = (obj as Record<string, unknown>)["faqs"];
        if (Array.isArray(v) && v.length === 0) return [];
      }
    }
  } catch {
    /* ignore — fall back to derived data below */
  }

  if (fallbackData.faqs.length === 0) {
    return [];
  }

  return fallbackData.faqs
    .map((faq) => {
      const raw = translator(faq.answerKey, { defaultValue: faq.defaultAnswer }) as unknown;
      const answerHtml = typeof raw === "string" ? raw : "";
      const withoutTokens = stripGuideLinkTokens(answerHtml || "");
      const withoutMarkup = withoutTokens.replace(/<[^>]+>/g, "");
      const normalized = withoutMarkup.replace(/\s+/g, " ").trim();
      const question = faq.question.trim();
      const answerText = normalized.length > 0 ? normalized : faq.defaultAnswer;
      const answer = answerText.trim();
      if (!question || !answer) {
        return null;
      }
      return { question, answer: [answer] } satisfies NormalizedFaqEntry;
    })
    .filter((entry): entry is NormalizedFaqEntry => entry != null);
}
