// src/components/guides/generic-content/buildContent.ts
import { getContentAlias, shouldMergeAliasFaqs } from "@/config/guide-overrides";
import i18n from "@/i18n";
import type { GuideKey } from "@/routes.guides-helpers";
import { debugGuide } from "@/utils/debug";
import { allowEnglishGuideFallback } from "@/utils/guideFallbackPolicy";

import {
  applyAliasKeyLabel,
  applyFallbackIfGeneric,
  applyLegacyFaqAlias,
  resolveInitialFaqsTitle,
} from "./faqsTitleHelpers";
import { buildCostsSection, buildEssentialsSection } from "./listSectionBuilders";
import { applyBackCompatTocLabels, resolveSectionsWithAlias } from "./sectionResolvers";
import { resolveSections } from "./sections";
import { looksLikePlaceholderTranslation, toStringArray } from "./strings";
import { resolveTipsTitle, resolveTocTitle, resolveWarningsTitle } from "./titleResolvers";
import { normaliseTocOverrides } from "./toc";
import { resolveLabelFallback } from "./translations";
import type {
  FAQ,
  GenericContentTranslator,
  ListSectionConfig,
  ResolvedSection,
  SupplementalNavEntry,
  TocOverrides,
} from "./types";

export type GenericContentData = {
  intro: string[];
  sections: ResolvedSection[];
  faqs: FAQ[];
  faqsTitle: string;
  faqsTitleSuppressed: boolean;
  tips: string[];
  tipsTitle: string;
  warnings: string[];
  warningsTitle: string;
  essentialsSection: ListSectionConfig | null;
  costsSection: ListSectionConfig | null;
  tocTitle?: string;
  tocRaw: unknown;
  supplementalNav: SupplementalNavEntry[];
};

function filterPlaceholder(value: string, expectedKey: string, guideKey: GuideKey): boolean {
  try {
    const normalised = value.replace(/^[a-z]{2,3}:/i, "").trim();
    if (!normalised) return false;
    if (normalised === expectedKey) return false;
    if (normalised === String(guideKey)) return false;
    if (normalised.startsWith("content.") && normalised.includes(String(guideKey))) return false;
    return true;
  } catch {
    return true;
  }
}

function tryEnglishFallback(
  guideKey: GuideKey,
  contentKey: string,
  baseContent: string[],
): string[] {
  if (baseContent.length > 0) return baseContent;

  try {
    const lang = typeof i18n?.language === 'string' ? i18n.language : '';
    if (!allowEnglishGuideFallback(lang)) return baseContent;

    const getEn = i18n?.getFixedT?.('en', 'guides');
    if (typeof getEn !== 'function') return baseContent;

    const sentinel = contentKey;
    const raw = getEn(sentinel, { returnObjects: true }) as unknown;

    // Avoid treating key-sentinel strings as content
    if (typeof raw === 'string' && raw.trim() === sentinel) {
      return baseContent;
    }

    const en = toStringArray(raw);
    if (en.length > 0) return en;
  } catch { /* noop */ }

  return baseContent;
}

function buildIntro(
  t: GenericContentTranslator,
  guideKey: GuideKey,
  introRaw: unknown,
  aliasKey: GuideKey | null | undefined,
): string[] {
  const base = toStringArray(introRaw);
  const baseMeaningful = base.filter((paragraph) =>
    filterPlaceholder(paragraph, `content.${guideKey}.intro`, guideKey),
  );

  if (aliasKey && baseMeaningful.length === 0) {
    try {
      const aliasIntro = toStringArray(
        t(`content.${aliasKey}.intro`, { returnObjects: true }),
      );
      if (aliasIntro.length > 0) return aliasIntro;
    } catch { /* noop */ }
  }

  return tryEnglishFallback(guideKey, `content.${guideKey}.intro`, baseMeaningful);
}

function normaliseFaq(entry: unknown): FAQ | null {
  try {
    if (!entry || typeof entry !== "object") return null;
    const obj = entry as Record<string, unknown>;
    const qRaw =
      ("q" in obj ? obj["q"] : undefined) ?? ("question" in obj ? obj["question"] : undefined);
    const aRaw =
      ("a" in obj ? obj["a"] : undefined) ?? ("answer" in obj ? obj["answer"] : undefined);
    const q = typeof qRaw === "string" ? qRaw.trim() : "";
    if (!q) return null;
    const answers = toStringArray(aRaw);
    if (answers.length === 0) return null;
    return { q, a: answers };
  } catch {
    return null;
  }
}

function dedupFaqs(faqs: FAQ[]): FAQ[] {
  const seen = new Set<string>();
  return faqs.filter((item) => {
    const key = `${item.q}::${Array.isArray(item.a) ? item.a.join("\u0001") : String(item.a)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildFaqs(
  t: GenericContentTranslator,
  guideKey: GuideKey,
  faqsRaw: unknown,
  faqRaw: unknown,
  aliasKey: GuideKey | null | undefined,
  mergeAliasFaqs: boolean,
): FAQ[] {
  // Prefer route-specific alias FAQs when present
  const aliasFaqsA = aliasKey && mergeAliasFaqs
    ? ((): FAQ[] => {
        try {
          const raw = t(`content.${aliasKey}.faqs`, { returnObjects: true });
          return Array.isArray(raw) ? (raw as FAQ[]) : [];
        } catch { return []; }
      })()
    : [];
  const aliasFaqsB = aliasKey && mergeAliasFaqs
    ? ((): FAQ[] => {
        try {
          const raw = t(`content.${aliasKey}.faq`, { returnObjects: true });
          return Array.isArray(raw) ? (raw as FAQ[]) : [];
        } catch { return []; }
      })()
    : [];
  const faqsA = Array.isArray(faqsRaw) ? (faqsRaw as FAQ[]) : [];
  const faqsB = Array.isArray(faqRaw) ? (faqRaw as FAQ[]) : [];

  const combinedFaqs = [...aliasFaqsA, ...aliasFaqsB, ...faqsA, ...faqsB]
    .map((e) => normaliseFaq(e))
    .filter((e): e is FAQ => e != null);

  let faqs = dedupFaqs(combinedFaqs);

  if (faqs.length === 0) {
    try {
      const lang = typeof i18n?.language === 'string' ? i18n.language : '';
      if (allowEnglishGuideFallback(lang)) {
        const getEn = i18n?.getFixedT?.('en', 'guides');
        if (typeof getEn === 'function') {
          const enA = getEn(`content.${guideKey}.faqs`, { returnObjects: true }) as unknown;
          const enB = getEn(`content.${guideKey}.faq`, { returnObjects: true }) as unknown;
          const toArr = (val: unknown) => (Array.isArray(val) ? (val as unknown[]) : []);
          const merged = [...toArr(enA), ...toArr(enB)]
            .map((e) => normaliseFaq(e))
            .filter((e): e is FAQ => e != null);
          if (merged.length > 0) faqs = dedupFaqs(merged);
        }
      }
    } catch { /* noop */ }
  }

  return faqs;
}

function resolveFaqsTitle(
  t: GenericContentTranslator,
  guideKey: GuideKey,
  aliasKey: GuideKey | null | undefined,
  mergeAliasFaqs: boolean,
  tocOverrides: TocOverrides,
): { faqsTitle: string; faqsTitleSuppressed: boolean } {
  const faqsTitleKey = `content.${guideKey}.faqsTitle` as const;
  const faqsFallback = resolveLabelFallback(t, "labels.faqsHeading") ?? '';
  const faqsTitleRaw = t(faqsTitleKey) as unknown;
  const faqsRawTrimmed = typeof faqsTitleRaw === 'string' ? faqsTitleRaw.trim() : '';

  // 1) Resolve initial title
  const { title: initialTitle, suppressed: initialSuppressed } = resolveInitialFaqsTitle({
    t,
    faqsTitleKey,
    faqsTitleRaw,
    faqsRawTrimmed,
    faqsFallback,
    tocOverrides,
  });

  let faqsTitle = initialTitle;
  let faqsTitleSuppressed = initialSuppressed;

  // 2) Apply legacy alias
  faqsTitle = applyLegacyFaqAlias(t, guideKey, faqsTitleKey, faqsTitle);

  // 3) Apply fallback if generic
  faqsTitle = applyFallbackIfGeneric(faqsTitle, faqsFallback);

  // 4) Update suppressed flag
  if (typeof faqsTitle === 'string' && faqsTitle.trim().length > 0) {
    faqsTitleSuppressed = false;
  }

  // 5) Apply alias key label
  faqsTitle = applyAliasKeyLabel(t, aliasKey, mergeAliasFaqs, faqsTitle);

  return { faqsTitle, faqsTitleSuppressed };
}

export function buildGenericContentData(
  t: GenericContentTranslator,
  guideKey: GuideKey,
): GenericContentData | null {
  const introRaw = t(`content.${guideKey}.intro`, { returnObjects: true });
  const sectionsRaw = t(`content.${guideKey}.sections`, { returnObjects: true });
  const faqsRaw = t(`content.${guideKey}.faqs`, { returnObjects: true });
  const faqRaw = t(`content.${guideKey}.faq`, { returnObjects: true });
  const tocRaw = t(`content.${guideKey}.toc`, { returnObjects: true });
  const tipsRaw = t(`content.${guideKey}.tips`, { returnObjects: true });
  const warningsRaw = t(`content.${guideKey}.warnings`, { returnObjects: true });
  const warningsContentKey = `content.${guideKey}.warnings` as const;
  const aliasKey = getContentAlias(guideKey);
  const mergeAliasFaqs = shouldMergeAliasFaqs(guideKey);

  const intro = buildIntro(t, guideKey, introRaw, aliasKey);

  const sections = resolveSectionsWithAlias(sectionsRaw, t, guideKey, aliasKey);

  const tocOverrides = normaliseTocOverrides(tocRaw);
  applyBackCompatTocLabels(t, guideKey, tocOverrides);

  const faqs = buildFaqs(t, guideKey, faqsRaw, faqRaw, aliasKey, mergeAliasFaqs);

  const tocTitle = resolveTocTitle(t, guideKey, tocOverrides);

  const { faqsTitle, faqsTitleSuppressed } = resolveFaqsTitle(
    t,
    guideKey,
    aliasKey,
    mergeAliasFaqs,
    tocOverrides,
  );

  const tipsContentKey = `content.${guideKey}.tips` as const;
  const tips = toStringArray(tipsRaw).filter((value) =>
    !looksLikePlaceholderTranslation(value, tipsContentKey, guideKey),
  );
  const warnings = toStringArray(warningsRaw).filter((value) =>
    !looksLikePlaceholderTranslation(value, warningsContentKey, guideKey),
  );

  const tipsTitle = resolveTipsTitle(t, guideKey, tocOverrides);
  const warningsTitle = resolveWarningsTitle(t, guideKey, tocOverrides);

  const essentialsSection = buildEssentialsSection(t, guideKey, tocOverrides);
  const costsSection = buildCostsSection(t, guideKey, tocOverrides);

  const resolvedSections = resolveSections(sections, tocOverrides);

  const hasContent =
    intro.length > 0 ||
    resolvedSections.length > 0 ||
    faqs.length > 0 ||
    tips.length > 0 ||
    warnings.length > 0 ||
    Boolean(essentialsSection) ||
    Boolean(costsSection);

  if (!hasContent) {
    return null;
  }

  const supplementalNav = buildSupplementalNav([
    essentialsSection ? { id: essentialsSection.id, label: essentialsSection.title } : null,
    costsSection ? { id: costsSection.id, label: costsSection.title } : null,
    tips.length > 0 ? { id: "tips", label: tipsTitle } : null,
    warnings.length > 0 ? { id: "warnings", label: warningsTitle } : null,
    faqs.length > 0 ? { id: "faqs", label: faqsTitle } : null,
  ]);
  try {
    debugGuide('GenericContent buildContent faqsTitle', { faqsTitle, hasFaqs: faqs.length > 0, supplementalNav }); // i18n-exempt -- OPS-123 [ttl=2099-12-31]
  } catch {
    void 0;
  }

  return {
    intro,
    sections: resolvedSections,
    faqs,
    faqsTitle,
    faqsTitleSuppressed,
    tips,
    tipsTitle,
    warnings,
    warningsTitle,
    essentialsSection,
    costsSection,
    tocRaw,
    supplementalNav,
    ...(tocTitle !== undefined ? { tocTitle } : {}),
  };
}

function buildSupplementalNav(entries: Array<{ id: string; label: string } | null>): SupplementalNavEntry[] {
  return entries.filter((entry): entry is SupplementalNavEntry => entry != null);
}
