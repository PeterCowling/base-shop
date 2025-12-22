// src/routes/guides/ferry-schedules/normalisers.ts
import { ensureStringArray, ensureStringArrayPreserveWhitespace } from "@/utils/i18nContent";

import { GUIDE_KEY } from "./constants";
import type { FerryFaq, FerryGalleryItem, FerrySection } from "./types";

type NormaliseSectionsOptions = {
  preserveBodyWhitespace?: boolean;
};

export function normaliseSections(
  value: unknown,
  options: NormaliseSectionsOptions = {},
): FerrySection[] {
  const { preserveBodyWhitespace = true } = options;
  if (!Array.isArray(value)) return [];
  return value
    .map((section, index) => {
      if (!section || typeof section !== "object") return null;
      const { id, title, body } = section as { id?: unknown; title?: unknown; body?: unknown };
      const resolvedId = typeof id === "string" && id.trim().length > 0 ? id.trim() : `section-${index}`;
      const resolvedTitle = typeof title === "string" ? title.trim() : "";
      const resolvedBody = preserveBodyWhitespace
        ? ensureStringArrayPreserveWhitespace(body)
        : ensureStringArray(body).map((line) => line.trim());
      if (resolvedTitle.length === 0 && resolvedBody.length === 0) return null;
      return { id: resolvedId, title: resolvedTitle, body: resolvedBody } satisfies FerrySection;
    })
    .filter((section): section is FerrySection => section != null);
}

type FallbackStage = "primary" | "fallbackLocal" | "fallbackEnglish" | "static";

export function normaliseFaqs(value: unknown, stage?: FallbackStage): FerryFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((faq) => {
      if (!faq || typeof faq !== "object") return null;
      const { q, a } = faq as { q?: unknown; a?: unknown };
      const question = typeof q === "string" ? q.trim() : "";
      const answer = stage === "primary" || stage === "fallbackLocal"
        ? ensureStringArrayPreserveWhitespace(a)
        : ensureStringArray(a).map((line) => line.trim());
      if (question.length === 0 || answer.length === 0) return null;
      return { q: question, a: answer } satisfies FerryFaq;
    })
    .filter((entry): entry is FerryFaq => entry != null);
}

export function normaliseGallery(
  fallbackLocal: unknown,
  fallbackEnglish: unknown,
  staticFallback: unknown,
  sources: readonly string[],
  translateString: (key: string, fallback?: string) => string,
  galleryFallbackLabel: string,
): FerryGalleryItem[] {
  const coerceItems = (value: unknown): Array<{ alt?: unknown; caption?: unknown }> => {
    if (Array.isArray(value)) {
      return value as Array<{ alt?: unknown; caption?: unknown }>;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      if (Array.isArray(record["items"])) {
        return record["items"] as Array<{ alt?: unknown; caption?: unknown }>;
      }
      if (record["alt"] != null || record["caption"] != null) {
        return [record as { alt?: unknown; caption?: unknown }];
      }
    }
    return [];
  };

  const fallbackStages = [fallbackLocal, fallbackEnglish, staticFallback].map(coerceItems);

  const pickStageForAlt = (index: number): number | -1 => {
    for (let s = 0; s < fallbackStages.length; s++) {
      const raw = fallbackStages[s]?.[index]?.["alt"];
      if (typeof raw === "string" && raw.trim().length > 0) return s;
      if (raw != null && String(raw).trim().length > 0) return s;
    }
    return -1;
  };

  const readFieldFromStage = (
    stageIndex: number,
    index: number,
    field: "alt" | "caption",
  ): string | undefined => {
    const stage = fallbackStages[stageIndex];
    const raw = stage?.[index]?.[field];
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    if (raw != null) {
      const stringified = String(raw).trim();
      return stringified.length > 0 ? stringified : undefined;
    }
    return undefined;
  };

  return sources.map((src, index) => {
    const stageForAlt = pickStageForAlt(index);
    const altFallback = stageForAlt >= 0
      ? readFieldFromStage(stageForAlt, index, "alt") ?? galleryFallbackLabel
      : galleryFallbackLabel;
    const alt = translateString(`content.${GUIDE_KEY}.gallery.items.${index}.alt`, altFallback);

    let captionFallback: string | undefined;
    if (stageForAlt >= 0) {
      captionFallback = readFieldFromStage(stageForAlt, index, "caption");
    } else {
      captionFallback = undefined; // Do not surface captions if alt is generic
    }
    const caption = translateString(
      `content.${GUIDE_KEY}.gallery.items.${index}.caption`,
      captionFallback,
    );
    const resolvedCaption = caption.trim().length > 0 ? caption : undefined;

    // If the resolved alt is the generic gallery label, suppress any caption.
    const captionFinal = alt === galleryFallbackLabel ? undefined : resolvedCaption;

    return {
      src,
      alt,
      ...(captionFinal ? { caption: captionFinal } : {}),
    } satisfies FerryGalleryItem;
  });
}
