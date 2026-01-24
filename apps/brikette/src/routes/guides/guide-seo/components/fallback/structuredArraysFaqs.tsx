import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";

import type { Translator } from "../../types";
import type { FallbackTranslator } from "../../utils/fallbacks";

import type { GuidesTranslationsMinimal } from "./structuredArraysContent";

export type FaqEntry = { q: string; a: string[] };

export function resolveStructuredArrayFaqs({
  tFb,
  translations,
  guideKey,
  alias,
}: {
  tFb: FallbackTranslator | undefined;
  translations: GuidesTranslationsMinimal;
  guideKey: string;
  alias?: string | null;
}): FaqEntry[] {
  let faqsFb1Raw = ensureArray<{
    q?: string;
    question?: string;
    a?: unknown;
    answer?: unknown;
  }>(tFb?.(`content.${guideKey}.faqs`, { returnObjects: true }));
  if (faqsFb1Raw.length === 0) {
    faqsFb1Raw = ensureArray<{
      q?: string;
      question?: string;
      a?: unknown;
      answer?: unknown;
    }>(tFb?.(`${guideKey}.faqs`, { returnObjects: true }));
  }
  // Special-case: the Interrail guide may supply FAQs under the alias key
  // (interrailItalyRailPassAmalfiCoast) within the guidesFallback namespace.
  if (alias && faqsFb1Raw.length === 0) {
    try {
      const aliasFaqs1 = ensureArray<{ q?: string; question?: string; a?: unknown; answer?: unknown }>(
        tFb?.(`content.${alias}.faqs`, { returnObjects: true }),
      );
      const aliasFaqs2 = aliasFaqs1.length > 0
        ? []
        : ensureArray<{ q?: string; question?: string; a?: unknown; answer?: unknown }>(
            tFb?.(`${alias}.faqs`, { returnObjects: true }),
          );
      const picked = aliasFaqs1.length > 0 ? aliasFaqs1 : aliasFaqs2;
      if (picked.length > 0) faqsFb1Raw = picked;
    } catch {
      /* noop: alias FAQs not present in fallback translator */
    }
  }
  // Merge generic (guides) FAQs with fallback FAQs, keeping generic first
  const faqsGenericRaw = alias
    ? ensureArray<{ q?: string; question?: string; a?: unknown; answer?: unknown }>(
        translations?.tGuides?.(`content.${guideKey}.faqs`, { returnObjects: true }) as unknown,
      )
    : [];
  const faqsGeneric = faqsGenericRaw
    .map((f) => {
      if (!f || typeof f !== "object") return null;
      const qRaw = typeof f.q === "string" ? f.q : typeof f.question === "string" ? f.question : "";
      const q = qRaw.trim();
      const a = ensureStringArray(f.a ?? f.answer);
      if (!q || a.length === 0) return null;
      return { q, a };
    })
    .filter((x): x is FaqEntry => x != null);

  const faqsFb = faqsFb1Raw
    .map((f) => {
      const qRaw = typeof f?.q === "string" ? f.q : typeof f?.question === "string" ? f.question : "";
      const q = qRaw.trim();
      const aSrc = f?.a ?? f?.answer;
      const a = ensureStringArray(aSrc);
      if (!q) return null;
      return { q, a };
    })
    .filter((x): x is FaqEntry => x != null);

  return [...faqsGeneric, ...faqsFb];
}

export function resolveStructuredArrayFaqHeading({
  tFb,
  translations,
  t,
  guideKey,
  alias,
}: {
  tFb: FallbackTranslator | undefined;
  translations: GuidesTranslationsMinimal;
  t: Translator;
  guideKey: string;
  alias?: string | null;
}): string {
  // Prefer a curated fallback FAQs title when provided; otherwise
  // fall back to the generic localized "FAQs" label.
  try {
    const k1 = `content.${guideKey}.faqsTitle` as const;
    const raw1: unknown = tFb?.(k1);
    const s1 = typeof raw1 === "string" ? raw1.trim() : "";
    if (s1 && s1 !== k1) return s1;
  } catch {
    /* noop */
  }
  try {
    const k2 = `${guideKey}.faqsTitle` as const;
    const raw2: unknown = tFb?.(k2);
    const s2 = typeof raw2 === "string" ? raw2.trim() : "";
    if (s2 && s2 !== k2) return s2;
  } catch {
    /* noop */
  }
  // Content alias: prefer a direct fallback FAQs title under the
  // alias key when provided.
  if (alias) {
    try {
      const rawA1: unknown = tFb?.(`content.${alias}.faqsTitle`);
      const sA1 = typeof rawA1 === "string" ? rawA1.trim() : "";
      if (sA1 && sA1 !== `content.${alias}.faqsTitle`) {
        return sA1;
      }
    } catch {
      /* noop */
    }
    try {
      const rawA2: unknown = tFb?.(`${alias}.faqsTitle`);
      const sA2 = typeof rawA2 === "string" ? rawA2.trim() : "";
      if (sA2 && sA2 !== `${alias}.faqsTitle`) {
        return sA2;
      }
    } catch {
      /* noop */
    }
    // When a specific FAQs label is provided under the alias key's
    // toc.faqs, use it as the section heading.
    try {
      const aliasLabelRaw: unknown = translations.tGuides(
        `content.${alias}.toc.faqs`,
      );
      const aliasLabel = typeof aliasLabelRaw === "string" ? aliasLabelRaw.trim() : "";
      if (aliasLabel && aliasLabel !== `content.${alias}.toc.faqs`) {
        return aliasLabel;
      }
    } catch {
      /* noop */
    }
  }
  return (t("labels.faqsHeading", { defaultValue: "FAQs" }) as string) ?? "FAQs";
}
