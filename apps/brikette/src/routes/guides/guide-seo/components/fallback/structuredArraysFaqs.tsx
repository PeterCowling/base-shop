import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";

import type { Translator } from "../../types";
import type { FallbackTranslator } from "../../utils/fallbacks";

import type { GuidesTranslationsMinimal } from "./structuredArraysContent";

export type FaqEntry = { q: string; a: string[] };

function resolveFallbackHeading(
  translator: FallbackTranslator | undefined,
  key: string,
): string | undefined {
  try {
    const raw = translator?.(key);
    const heading = typeof raw === "string" ? raw.trim() : "";
    return heading && heading !== key ? heading : undefined;
  } catch {
    return undefined;
  }
}

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
  const headingKeys = [`content.${guideKey}.faqsTitle`, `${guideKey}.faqsTitle`];
  for (const key of headingKeys) {
    const heading = resolveFallbackHeading(tFb, key);
    if (heading) return heading;
  }
  // Content alias: prefer a direct fallback FAQs title under the
  // alias key when provided.
  if (alias) {
    const aliasHeadingKeys = [`content.${alias}.faqsTitle`, `${alias}.faqsTitle`];
    for (const key of aliasHeadingKeys) {
      const heading = resolveFallbackHeading(tFb, key);
      if (heading) return heading;
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
