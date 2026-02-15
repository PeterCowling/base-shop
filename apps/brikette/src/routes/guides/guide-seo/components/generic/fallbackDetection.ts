import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";

import type { GuidesTranslator } from "./translator";

export function manualFallbackHasMeaningfulContent(candidate: unknown): boolean {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  const record = candidate as Record<string, unknown>;
  const intro = ensureStringArray(record["intro"]).some((entry) => entry.trim().length > 0);
  const sections = ensureArray<{
    id?: string;
    title?: string;
    heading?: string;
    body?: unknown;
    items?: unknown;
  }>(record["sections"]).some((section) => {
    if (!section || typeof section !== "object") return false;
    const titleRaw = typeof section.title === "string" ? section.title : section.heading;
    const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
    const body = ensureStringArray(section.body ?? section.items);
    return title.length > 0 || body.length > 0;
  });
  const faqBlock = (record as Record<string, unknown>)["faq"];
  const faqMeaningful = (() => {
    if (!faqBlock || typeof faqBlock !== "object") return false;
    const summaryValue = (faqBlock as Record<string, unknown>)["summary"];
    const summary = typeof summaryValue === "string" ? summaryValue.trim() : "";
    if (summary.length > 0) return true;
    const answerValue = (faqBlock as Record<string, unknown>)["answer"];
    const answer = ensureStringArray(answerValue);
    return answer.length > 0;
  })();
  return intro || sections || faqMeaningful;
}

export function detectHasAnyFallback(params: {
  hasStructured: boolean;
  hasStructuredEn: boolean;
  translations: { tGuides: GuidesTranslator };
  guideKey: string;
  resolveEnGuidesTranslator: () => GuidesTranslator | undefined;
}): boolean {
  const { hasStructured, hasStructuredEn, translations, guideKey, resolveEnGuidesTranslator } = params;
  if (hasStructured || hasStructuredEn) return false;

  const k = `content.${guideKey}.fallback` as const;
  const safeGet = <T,>(fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };

  const manualLocal = safeGet(() => translations.tGuides(k, { returnObjects: true }) as unknown, undefined);
  if (manualFallbackHasMeaningfulContent(manualLocal)) return true;

  const enTranslator = resolveEnGuidesTranslator();
  const manualEn =
    typeof enTranslator === "function"
      ? safeGet(() => enTranslator(k, { returnObjects: true }) as unknown, undefined)
      : undefined;
  if (manualFallbackHasMeaningfulContent(manualEn)) return true;

  const localStr = safeGet(() => translations.tGuides(k) as unknown, undefined);
  const localStrTrimmed = typeof localStr === "string" ? localStr.trim() : "";
  return localStrTrimmed.length > 0 && localStrTrimmed !== k;
}
