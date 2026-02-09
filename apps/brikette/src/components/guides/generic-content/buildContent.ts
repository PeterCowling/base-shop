// src/components/guides/generic-content/buildContent.ts
import { getContentAlias, shouldMergeAliasFaqs } from "@/config/guide-overrides";
import i18n from "@/i18n";
import type { GuideKey } from "@/routes.guides-helpers";
import { debugGuide } from "@/utils/debug";
import { allowEnglishGuideFallback } from "@/utils/guideFallbackPolicy";

import { resolveSections, toListSection } from "./sections";
import { looksLikePlaceholderTranslation, toStringArray, toTrimmedString } from "./strings";
import { normaliseTocOverrides } from "./toc";
import { resolveLabelFallback, resolveTitle } from "./translations";
import type {
  FAQ,
  GenericContentTranslator,
  ListSectionConfig,
  ResolvedSection,
  Section,
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

  const sections = (() => {
    if (Array.isArray(sectionsRaw)) {
      const base = sectionsRaw as Section[];
      if (aliasKey && (!Array.isArray(base) || base.length === 0)) {
        try {
          const aliasSections = t(`content.${aliasKey}.sections`, { returnObjects: true }) as unknown;
          if (Array.isArray(aliasSections)) return aliasSections as Section[];
        } catch { /* noop */ }
      }
      return base;
    }
    if (aliasKey) {
      try {
        const aliasSections = t(`content.${aliasKey}.sections`, { returnObjects: true }) as unknown;
        if (Array.isArray(aliasSections)) return aliasSections as Section[];
      } catch { /* noop */ }
    }
    return [] as Section[];
  })();
  const tocOverrides = normaliseTocOverrides(tocRaw);
  // Back-compat: allow translators to provide base labels outside the `toc` object
  // e.g., `content.<key>.toc.section` and `content.<key>.toc.faqs`.
  try {
    const sectionBase = t(`content.${guideKey}.toc.section`) as string;
    if (typeof sectionBase === "string") {
      const trimmed = sectionBase.trim();
      const k = `content.${guideKey}.toc.section` as const;
      if (trimmed && trimmed !== k && !tocOverrides.labels.has("section")) {
        tocOverrides.labels.set("section", trimmed);
      }
    }
  } catch {
    void 0;
  }
  try {
    const faqsBase = t(`content.${guideKey}.toc.faqs`) as string;
    if (typeof faqsBase === "string") {
      const trimmed = faqsBase.trim();
      const k = `content.${guideKey}.toc.faqs` as const;
      if (trimmed && trimmed !== k && !tocOverrides.labels.has("faqs")) {
        tocOverrides.labels.set("faqs", trimmed);
      }
    }
  } catch {
    void 0;
  }

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
  // Normalise and deduplicate FAQs across both shapes (faqs/faq)
  const normaliseFaq = (entry: unknown): FAQ | null => {
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
  };

  const combinedFaqs = [...aliasFaqsA, ...aliasFaqsB, ...faqsA, ...faqsB]
    .map((e) => normaliseFaq(e))
    .filter((e): e is FAQ => e != null);

  const seen = new Set<string>();
  let faqs = combinedFaqs.filter((item) => {
    const key = `${item.q}::${Array.isArray(item.a) ? item.a.join("\u0001") : String(item.a)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

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
          const dedup = new Set<string>();
          const unique = merged.filter((item) => {
            const key = `${item.q}::${Array.isArray(item.a) ? item.a.join('\u0001') : String(item.a)}`;
            if (dedup.has(key)) return false;
            dedup.add(key);
            return true;
          });
          if (unique.length > 0) faqs = unique;
        }
      }
    } catch { /* noop */ }
  }

  const tocTitle = resolveTocTitle(t, guideKey, tocOverrides);

  const faqsTitleKey = `content.${guideKey}.faqsTitle` as const;
  const faqsFallback = resolveLabelFallback(t, "labels.faqsHeading");
  const faqsTitleRaw = t(faqsTitleKey) as unknown;
  const faqsRawTrimmed = typeof faqsTitleRaw === 'string' ? faqsTitleRaw.trim() : '';
  let faqsTitleSuppressed = false;
  let faqsTitle = ((): string => {
    if (typeof faqsTitleRaw === 'string' && faqsRawTrimmed.length === 0) {
      // When the localized title is deliberately blank, prefer an explicit EN
      // fallback if one exists; otherwise mark the heading as suppressed so the
      // section renders without an H2 and the ToC omits the FAQs anchor.
      try {
        const enRaw = t(faqsTitleKey, { lng: 'en' }) as unknown;
        const en = typeof enRaw === 'string' ? enRaw.trim() : '';
        if (en && en !== faqsTitleKey) {
          return en;
        }
      } catch { /* noop */ }
      faqsTitleSuppressed = true;
      return '';
    }
    return resolveTitle(
      faqsTitleRaw as string,
      faqsTitleKey,
      faqsFallback,
      tocOverrides.labels.get("faqs"),
    );
  })();
  // Accept legacy alias: treat content.<key>.faqHeading as the FAQs section
  // title when faqsTitle is missing or generic. This keeps older content
  // bundles compatible with GenericContent.
  try {
    const aliasKey = `content.${guideKey}.faqHeading` as const;
    const alias = toTrimmedString(t(aliasKey) as unknown);
    const current = toTrimmedString(faqsTitle);
    const isGeneric = current ? current.toLowerCase() === "faqs" || current === faqsTitleKey : false;
    if (alias && alias !== aliasKey && (!current || isGeneric)) {
      faqsTitle = alias;
    }
  } catch {
    /* noop */
  }
  // If the resolved FAQs title is the generic default (e.g. "FAQs") but a
  // localized fallback exists for the heading label, prefer that value so the
  // ToC entry matches the section heading expected by tests and UX.
  if (
    faqsFallback &&
    faqsTitle &&
    faqsTitle.trim().toLowerCase() === "faqs" &&
    faqsFallback.trim().length > 0 &&
    faqsFallback.trim().toLowerCase() !== "faqs"
  ) {
    faqsTitle = faqsFallback;
  }

  if (typeof faqsTitle === 'string' && faqsTitle.trim().length > 0) {
    faqsTitleSuppressed = false;
  }

  // Route-specific alias support: prefer the alias key's ToC FAQs label when
  // present. This allows `content.<alias>.toc.faqs` to define the FAQs section
  // heading even when the primary guide key is used. Always prefer the alias
  // when provided to match tests/UX.
  if (aliasKey && mergeAliasFaqs) {
    try {
      const aliasKeyPath = `content.${aliasKey}.toc.faqs` as const;
      const aliasLabel = toTrimmedString(t(aliasKeyPath) as unknown);
      if (aliasLabel && aliasLabel !== aliasKeyPath) {
        faqsTitle = aliasLabel;
      }
    } catch {
      void 0;
    }
  }

  const tipsContentKey = `content.${guideKey}.tips` as const;
  const tips = toStringArray(tipsRaw).filter((value) =>
    !looksLikePlaceholderTranslation(value, tipsContentKey, guideKey),
  );
  const warnings = toStringArray(warningsRaw).filter((value) =>
    !looksLikePlaceholderTranslation(value, warningsContentKey, guideKey),
  );

  const tipsKey = "labels.tipsHeading" as const;
  const warningsKey = "labels.warningsHeading" as const;
  const defaultTipsTitle = resolveLabelFallback(t, tipsKey);
  const defaultWarningsTitle = resolveLabelFallback(t, warningsKey);

  const tipsTitleKey = `content.${guideKey}.tipsTitle` as const;
  const tipsTitle = resolveTitle(
    t(tipsTitleKey) as string,
    tipsTitleKey,
    defaultTipsTitle,
    tocOverrides.labels.get("tips"),
  );

  const warningsTitleKey = `content.${guideKey}.warningsTitle` as const;
  const warningsTitle = resolveTitle(
    t(warningsTitleKey) as string,
    warningsTitleKey,
    defaultWarningsTitle,
    tocOverrides.labels.get("warnings"),
  );

  const essentialsTitleKey = `content.${guideKey}.essentialsTitle` as const;
  const essentialsFallback = resolveLabelFallback(t, "labels.essentialsHeading");
  const essentialsTitle = resolveTitle(
    t(essentialsTitleKey) as string,
    essentialsTitleKey,
    essentialsFallback,
    tocOverrides.labels.get("essentials"),
  );

  const essentialsSection = toListSection(
    t(`content.${guideKey}.essentials`, { returnObjects: true }),
    essentialsTitle,
    "essentials",
    {
      expectedKey: `content.${guideKey}.essentials`,
      guideKey,
    },
  );

  const costsTitleKey = `content.${guideKey}.typicalCostsTitle` as const;
  const costsFallback = resolveLabelFallback(t, "labels.typicalCostsHeading");
  const costsTitle = resolveTitle(
    t(costsTitleKey) as string,
    costsTitleKey,
    costsFallback,
    tocOverrides.labels.get("costs"),
  );

  const costsSection = toListSection(
    t(`content.${guideKey}.typicalCosts`, { returnObjects: true }),
    costsTitle,
    "costs",
    {
      expectedKey: `content.${guideKey}.typicalCosts`,
      guideKey,
    },
  );

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

function resolveTocTitle(
  t: GenericContentTranslator,
  guideKey: string,
  tocOverrides: TocOverrides,
): string | undefined {
  const tocTitleKey = `content.${guideKey}.tocTitle` as const;
  const tocTitleRaw = t(tocTitleKey) as string;

  if (
    typeof tocTitleRaw === "string" &&
    tocTitleRaw.trim().length > 0 &&
    tocTitleRaw !== tocTitleKey
  ) {
    return tocTitleRaw;
  }

  if (tocOverrides.title && tocOverrides.title.trim().length > 0) {
    return tocOverrides.title;
  }

  return undefined;
}

function buildSupplementalNav(entries: Array<{ id: string; label: string } | null>): SupplementalNavEntry[] {
  return entries.filter((entry): entry is SupplementalNavEntry => entry != null);
}
