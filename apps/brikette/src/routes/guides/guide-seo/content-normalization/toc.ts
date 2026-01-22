/**
 * Table of contents normalization utilities.
 */
import { ensureArray } from "@/utils/i18nContent";

import type { NormalisedSection, TocItem } from "../types";

/**
 * Normalize raw ToC data into TocItem array.
 */
export function normalizeToc(value: unknown): TocItem[] {
  const rawToc = ensureArray<{ href?: string; label?: string }>(value);

  if (rawToc.length > 0) {
    return rawToc
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const label = typeof item.label === "string" ? item.label.trim() : "";
        const hrefRaw = typeof item.href === "string" ? item.href.trim() : "";
        // Accept label-only entries; href is normalised later by display logic.
        if (label.length === 0) return null;
        return { href: hrefRaw, label } satisfies TocItem;
      })
      .filter((entry): entry is TocItem => entry != null);
  }
  return [];
}

/**
 * Fill missing/blank hrefs in ToC by matching section titles to ids.
 */
export function fillTocHrefs(toc: TocItem[], sections: NormalisedSection[]): TocItem[] {
  const sectionByTitle = new Map<string, string>(
    sections
      .filter((s) => typeof s.title === "string" && s.title.trim().length > 0)
      .map((s) => [s.title.trim().toLowerCase(), s.id] as const),
  );

  return toc.map((item) => {
    const href = typeof item.href === "string" ? item.href.trim() : "";
    if (href.length > 0) return { href, label: item.label } as TocItem;
    const match = sectionByTitle.get(item.label.trim().toLowerCase());
    return { href: match ? `#${match}` : "", label: item.label } as TocItem;
  });
}

/**
 * Build ToC from sections as a last resort.
 * Only includes entries with meaningful titles AND non-empty bodies.
 */
export function buildTocFromSections(sections: NormalisedSection[]): TocItem[] {
  return sections
    .filter(
      (section) =>
        typeof section.title === "string" &&
        section.title.trim().length > 0 &&
        Array.isArray(section.body) &&
        section.body.length > 0,
    )
    .map((section) => ({ href: `#${section.id}`, label: section.title.trim() }));
}
