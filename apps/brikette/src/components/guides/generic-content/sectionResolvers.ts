// src/components/guides/generic-content/sectionResolvers.ts
import type { GuideKey } from "@/routes.guides-helpers";

import type {
  GenericContentTranslator,
  Section,
  TocOverrides,
} from "./types";

export function resolveSectionsWithAlias(
  sectionsRaw: unknown,
  t: GenericContentTranslator,
  guideKey: GuideKey,
  aliasKey: GuideKey | null | undefined,
): Section[] {
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
}

export function applyBackCompatTocLabels(
  t: GenericContentTranslator,
  guideKey: GuideKey,
  tocOverrides: TocOverrides,
): void {
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
}
