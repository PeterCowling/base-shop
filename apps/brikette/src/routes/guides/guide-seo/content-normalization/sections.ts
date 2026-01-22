/**
 * Section normalization utilities.
 */
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import type { NormalisedSection } from "../types";

/**
 * Normalize raw section data into NormalisedSection array.
 */
export function normalizeSections(value: unknown): NormalisedSection[] {
  const raw = ensureArray<{ id?: string | number; title?: string; body?: unknown; list?: unknown }>(value);

  return raw
    .map((section, index) => {
      if (!section || typeof section !== "object") return null;

      const id = (() => {
        const rawId = section.id;
        // Preserve meaningful string ids
        if (typeof rawId === "string" && rawId.trim().length > 0) {
          return rawId.trim();
        }
        // Preserve numeric ids as explicit anchors (e.g., id: 5 -> #section-5)
        if (typeof rawId === "number" && Number.isFinite(rawId)) {
          const normalisedNumber = Math.trunc(rawId);
          return `section-${normalisedNumber}`;
        }
        // Fallback to a predictable 1-based index anchor
        return `section-${index + 1}`;
      })();

      const title = typeof section.title === "string" ? section.title : "";
      const body = [
        ...ensureStringArray(section.body),
        ...ensureStringArray((section as { list?: unknown }).list),
      ];

      const candidate = { id, title, body } satisfies NormalisedSection;
      return candidate;
    })
    .filter(
      (section): section is NormalisedSection =>
        Boolean(section && (section.title.length > 0 || section.body.length > 0)),
    );
}
