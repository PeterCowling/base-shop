/**
 * Section normalization utilities.
 */
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import type { NormalisedSection } from "../types";

/**
 * Normalize raw section data into NormalisedSection array.
 */
export function normalizeSections(value: unknown): NormalisedSection[] {
  const raw = ensureArray<{
    id?: string | number;
    title?: string;
    body?: unknown;
    list?: unknown;
    images?: unknown;
  }>(value);

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

      const images = (() => {
        const rawImages = section.images;
        if (!Array.isArray(rawImages) || rawImages.length === 0) return undefined;
        const parsed = rawImages
          .map((image) => {
            if (!image || typeof image !== "object") return null;
            const record = image as Record<string, unknown>;
            const src = typeof record.src === "string" ? record.src.trim() : "";
            const alt = typeof record.alt === "string" ? record.alt.trim() : "";
            if (!src || !alt) return null;
            const captionRaw = record.caption;
            const caption = typeof captionRaw === "string" ? captionRaw.trim() : undefined;
            const widthRaw = record.width;
            const width =
              typeof widthRaw === "number" && Number.isFinite(widthRaw) && widthRaw > 0
                ? Math.trunc(widthRaw)
                : undefined;
            const heightRaw = record.height;
            const height =
              typeof heightRaw === "number" && Number.isFinite(heightRaw) && heightRaw > 0
                ? Math.trunc(heightRaw)
                : undefined;
            return {
              src,
              alt,
              ...(caption ? { caption } : {}),
              ...(typeof width === "number" ? { width } : {}),
              ...(typeof height === "number" ? { height } : {}),
            };
          })
          .filter((image): image is NonNullable<typeof image> => image != null);
        return parsed.length > 0 ? parsed : undefined;
      })();

      const candidate = { id, title, body, ...(images ? { images } : {}) } satisfies NormalisedSection;
      return candidate;
    })
    .filter(
      (section): section is NormalisedSection =>
        Boolean(section && (section.title.length > 0 || section.body.length > 0 || (section.images?.length ?? 0) > 0)),
    );
}
