import { GUIDE_KEY } from "./ferry-cancellations-weather.constants";

import type { FerryFaq, FerryGalleryItem, FerrySection } from "./ferry-cancellations-weather.types";

function ensureContentStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item == null) return undefined;
        const stringified = String(item);
        const trimmed = stringified.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      })
      .filter((item): item is string => typeof item === "string");
  }

  if (value == null) return [];

  const stringified = String(value);
  const trimmed = stringified.trim();
  return trimmed.length > 0 ? [trimmed] : [];
}

export function normaliseSections(value: unknown): FerrySection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((section, index) => {
      if (!section || typeof section !== "object") return null;
      const { id, title, body } = section as { id?: unknown; title?: unknown; body?: unknown };
      const resolvedId = typeof id === "string" && id.trim().length > 0 ? id.trim() : `section-${index}`;
      const resolvedTitle = typeof title === "string" ? title.trim() : "";
      const resolvedBody = ensureContentStringArray(body);
      if (resolvedTitle.length === 0 && resolvedBody.length === 0) return null;
      return { id: resolvedId, title: resolvedTitle, body: resolvedBody } satisfies FerrySection;
    })
    .filter((section): section is FerrySection => section != null);
}

export function normaliseFaqs(value: unknown): FerryFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((faq) => {
      if (!faq || typeof faq !== "object") return null;
      const { q, a } = faq as { q?: unknown; a?: unknown };
      const question = typeof q === "string" ? q.trim() : "";
      const answer = ensureContentStringArray(a);
      if (question.length === 0 || answer.length === 0) return null;
      return { q: question, a: answer } satisfies FerryFaq;
    })
    .filter((entry): entry is FerryFaq => entry != null);
}

export function normaliseGallery(
  value: unknown,
  sources: readonly string[],
  translateString: (key: string, fallback?: string) => string,
  galleryFallbackLabel: string,
): FerryGalleryItem[] {
  const items = normaliseGalleryItems(value);
  return sources.map((src, index) => {
    const config = items[index];
    const providedAlt =
      typeof config?.alt === "string" ? config.alt.trim() : config?.alt != null ? String(config.alt).trim() : "";
    const rawAlt =
      providedAlt.length > 0
        ? providedAlt
        : translateString(`content.${GUIDE_KEY}.gallery.items.${index}.alt`, galleryFallbackLabel);
    const alt = typeof rawAlt === "string" ? rawAlt.trim() : galleryFallbackLabel.trim();

    const providedCaption =
      typeof config?.caption === "string"
        ? config.caption.trim()
        : config?.caption != null
          ? String(config.caption).trim()
          : "";
    const translatedCaption = translateString(`content.${GUIDE_KEY}.gallery.items.${index}.caption`);
    const captionSource = providedCaption.length > 0 ? providedCaption : translatedCaption;
    const caption = typeof captionSource === "string" ? captionSource.trim() : "";
    return {
      src,
      alt,
      ...(caption.length > 0 ? { caption } : {}),
    } satisfies FerryGalleryItem;
  });
}

function normaliseGalleryItems(value: unknown): Array<{ alt?: unknown; caption?: unknown }> {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [{ alt: trimmed }] : [];
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record["items"])) {
      return record["items"] as Array<{ alt?: unknown; caption?: unknown }>;
    }

    const alt = record["alt"];
    const caption = record["caption"];
    if (alt != null || caption != null) {
      return [{ alt, caption }];
    }
  }

  return [];
}
