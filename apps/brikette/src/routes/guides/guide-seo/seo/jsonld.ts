import type { GuideKey } from "@/routes.guides-helpers";
import type { NormalizedFaqEntry, RawFaqEntry } from "@/utils/buildFaqJsonLd";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import type { i18n, TFunction } from "i18next";

export function normalizeFaqFallback(raw: unknown): NormalizedFaqEntry[] {
  try {
    const arr = ensureArray<RawFaqEntry>(raw);
    return arr
      .map((e) => {
        const qRaw = (e?.q ?? e?.question) as unknown;
        const q = qRaw == null ? "" : String(qRaw).trim();
        const aRaw = (e?.a ?? e?.answer) as unknown;
        const a = ensureStringArray(aRaw)
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
        if (!q || a.length === 0) return null;
        return { question: q, answer: a } satisfies NormalizedFaqEntry;
      })
      .filter((e): e is NormalizedFaqEntry => e != null);
  } catch {
    return [];
  }
}

/**
 * Create a fallback builder for GuideFaqJsonLd that merges local structured FAQs,
 * any route-provided fallback entries, and English structured FAQs as a last resort.
 * Returns a function suitable for the `fallback` prop of GuideFaqJsonLd.
 */
export function createGuideFaqFallbackBuilder(args: {
  guideKey: GuideKey;
  translateGuides: TFunction<"guides">;
  hookI18n?: Pick<i18n, "getFixedT">;
  appI18n?: Pick<i18n, "getFixedT">;
  routeFallback?: (lang: string) => RawFaqEntry[] | null | undefined;
}): (lang: string) => RawFaqEntry[] | undefined {
  const { guideKey, translateGuides, hookI18n, appI18n, routeFallback } = args;

  return (lang: string) => {
    const combined: NormalizedFaqEntry[] = [];
    const pushUnique = (list: NormalizedFaqEntry[] | undefined) => {
      if (!Array.isArray(list) || list.length === 0) return;
      for (const item of list) {
        const question = item.question.trim();
        const answer = item.answer;
        if (question.length === 0 || answer.length === 0) continue;
        if (!combined.some((e) => e.question === question)) {
          combined.push({ question, answer });
        }
      }
    };

    // 1) Localized structured FAQs (if available via translateGuides)
    try {
      const local = translateGuides(`content.${guideKey}.faqs`, { returnObjects: true });
      pushUnique(normalizeFaqFallback(local));
    } catch {
      void 0; // missing keys are expected; fallback below
    }

    // 2) Route-provided fallback
    if (typeof routeFallback === "function") {
      try {
        const extra = routeFallback(lang);
        pushUnique(normalizeFaqFallback(extra as unknown));
      } catch {
        void 0;
      }
    }

    if (combined.length > 0) {
      return combined.map(({ question, answer }) => ({ question, answer }));
    }

    // 3) English structured FAQs from guides namespace
    try {
      const enHook = hookI18n?.getFixedT?.("en", "guides");
      const enApp = appI18n?.getFixedT?.("en", "guides");
      const en = typeof enHook === "function" ? enHook : (typeof enApp === "function" ? enApp : undefined);
      if (typeof en === "function") {
        const fromEn = en(`content.${guideKey}.faqs`, { returnObjects: true });
        const cleanedEn = normalizeFaqFallback(fromEn);
        if (cleanedEn.length > 0) return cleanedEn as unknown as RawFaqEntry[];
      }
    } catch {
      void 0;
    }

    return undefined;
  };
}
