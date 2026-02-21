import { unifyNormalizedFaqEntries } from "@/utils/seo/jsonld";

import type { Translator } from "../../../types";
import type { FallbackTranslator } from "../../../utils/fallbacks";

export function resolveFallbackFaqs(
  tFb: FallbackTranslator | undefined,
  guideKey: string,
  legacyKey: string,
): Array<{ question: string; answer: string[] }> {
  try {
    const rawA = tFb?.(`content.${guideKey}.faqs`, { returnObjects: true }) as unknown;
    const rawB = tFb?.(`content.${guideKey}.faq`, { returnObjects: true }) as unknown;
    const rawE = tFb?.(`${guideKey}.faqs`, { returnObjects: true }) as unknown;
    const rawF = tFb?.(`${guideKey}.faq`, { returnObjects: true }) as unknown;
    const a = unifyNormalizedFaqEntries(rawA);
    const b = unifyNormalizedFaqEntries(rawB);
    const e = unifyNormalizedFaqEntries(rawE);
    const f = unifyNormalizedFaqEntries(rawF);
    if (a.length > 0 || b.length > 0 || e.length > 0 || f.length > 0)
      return a.length > 0 ? a : b.length > 0 ? b : e.length > 0 ? e : f;
    const rawC = tFb?.(`content.${legacyKey}.faqs`, { returnObjects: true }) as unknown;
    const rawD = tFb?.(`${legacyKey}.faqs`, { returnObjects: true }) as unknown;
    const c = unifyNormalizedFaqEntries(rawC);
    const d = unifyNormalizedFaqEntries(rawD);
    return c.length > 0 ? c : d;
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
  try {
    const k1 = `content.${guideKey}.faqsTitle` as const;
    const raw: unknown = tFb?.(k1);
    const s = typeof raw === "string" ? raw.trim() : "";
    if (s && s !== k1) return s;
  } catch {
    /* ignore – try alternate guidesFallback key */
  }
  try {
    const k2 = `${guideKey}.faqsTitle` as const;
    const raw: unknown = tFb?.(k2);
    const s = typeof raw === "string" ? raw.trim() : "";
    if (s && s !== k2) return s;
  } catch {
    /* ignore – fall back to default translator key */
  }
  // Alias guides: allow faqsTitle under the alias key in guidesFallback
  if (aliasKey && mergeAliasFaqs) {
    try {
      const kAlias = `content.${aliasKey}.faqsTitle` as const;
      const raw: unknown = tFb?.(kAlias);
      const s = typeof raw === 'string' ? raw.trim() : '';
      if (s && s !== kAlias) return s;
    } catch { /* noop */ }
    try {
      const kAlias2 = `${aliasKey}.faqsTitle` as const;
      const raw: unknown = tFb?.(kAlias2);
      const s = typeof raw === 'string' ? raw.trim() : '';
      if (s && s !== kAlias2) return s;
    } catch { /* noop */ }
  }
  try {
    const k3 = `content.${legacyKey}.faqsTitle` as const;
    const raw: unknown = tFb?.(k3);
    const s = typeof raw === "string" ? raw.trim() : "";
    if (s && s !== k3) return s;
  } catch { /* noop */ }
  try {
    const k4 = `${legacyKey}.faqsTitle` as const;
    const raw: unknown = tFb?.(k4);
    const s = typeof raw === "string" ? raw.trim() : "";
    if (s && s !== k4) return s;
  } catch { /* noop */ }
  return t("labels.faqsHeading", { defaultValue: "FAQs" }) as string;
}
