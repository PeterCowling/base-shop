// src/routes/guides/amalfi-coast-cuisine-guide.fallbacks.ts
import type { TFunction } from "i18next";

import { ensureArray } from "@/utils/i18nContent";

import type {
  FallbackSection,
  FallbackTocItem,
  GalleryTranslation,
  ItemListEntry,
} from "./amalfi-coast-cuisine-guide.constants";

export interface EnglishFallbacks {
  itemList: ItemListEntry[];
  galleryItems: GalleryTranslation[];
  itemListTitle: string;
  galleryTitle: string;
}

export function buildEnglishFallbacks(translator: TFunction<"guides">): EnglishFallbacks {
  const fallbackItemList = ensureArray<{ name?: string; note?: string }>(
    translator("content.cuisineAmalfiGuide.itemList", {
      returnObjects: true,
      defaultValue: [],
    }),
  )
    .map((entry) => ({
      name: typeof entry?.name === "string" ? entry.name.trim() : "",
      ...(typeof entry?.note === "string" && entry.note.trim().length > 0
        ? { note: entry.note.trim() }
        : {}),
    }))
    .filter((entry) => entry.name.length > 0);

  const fallbackGallery = ensureArray<GalleryTranslation>(
    translator("content.cuisineAmalfiGuide.gallery.items", {
      returnObjects: true,
      defaultValue: [],
    }),
  ).map((item) => ({
    ...(typeof item?.alt === "string" && item.alt.trim().length > 0
      ? { alt: item.alt.trim() }
      : {}),
    ...(typeof item?.caption === "string" && item.caption.trim().length > 0
      ? { caption: item.caption.trim() }
      : {}),
  }));

  const fallbackItemListTitle = translator("content.cuisineAmalfiGuide.itemListTitle", {
    defaultValue: "",
  });

  const fallbackGalleryTitle = translator("content.cuisineAmalfiGuide.gallery.title", {
    defaultValue: "",
  });

  return {
    itemList: fallbackItemList,
    galleryItems: fallbackGallery,
    itemListTitle:
      typeof fallbackItemListTitle === "string" ? fallbackItemListTitle.trim() : "",
    galleryTitle: typeof fallbackGalleryTitle === "string" ? fallbackGalleryTitle.trim() : "",
  } as const;
}

function normaliseToc(source: unknown): FallbackTocItem[] {
  const container = typeof source === "object" && source !== null ? (source as Record<string, unknown>) : {};
  return ensureArray<{ href?: string; label?: string }>(container["toc"])
    .map((item) => ({
      href: typeof item?.href === "string" ? item.href.trim() : "",
      label: typeof item?.label === "string" ? item.label.trim() : "",
    }))
    .filter((item) => item.href.length > 0 && item.label.length > 0);
}

function normaliseSections(source: unknown): FallbackSection[] {
  const container = typeof source === "object" && source !== null ? (source as Record<string, unknown>) : {};
  return ensureArray<{ id?: string; title?: string; body?: unknown }>(container["sections"])
    .map((section) => {
      const id = typeof section?.id === "string" ? section.id.trim() : "";
      const title = typeof section?.title === "string" ? section.title.trim() : "";
      const body = ensureArray<string>(section.body)
        .map((paragraph) => (typeof paragraph === "string" ? paragraph.trim() : ""))
        .filter((paragraph) => paragraph.length > 0);
      return { id, title, body } satisfies FallbackSection;
    })
    .filter((section) => section.id.length > 0 && section.title.length > 0 && section.body.length > 0);
}

export function buildFallbackStructuredContent(
  translator: TFunction<"guides">,
  englishTranslator: TFunction<"guides">
): { toc: FallbackTocItem[]; sections: FallbackSection[] } {
  const fallbackTranslations = translator("content.cuisineAmalfiGuide.fallback", {
    returnObjects: true,
    defaultValue: {},
  }) as unknown;

  const englishFallbackTranslations = englishTranslator("content.cuisineAmalfiGuide.fallback", {
    returnObjects: true,
    defaultValue: {},
  }) as unknown;

  const toc = (() => {
    const primary = normaliseToc(fallbackTranslations);
    if (primary.length > 0) return primary;
    return normaliseToc(englishFallbackTranslations);
  })();

  const sections = (() => {
    const primary = normaliseSections(fallbackTranslations);
    if (primary.length > 0) return primary;
    return normaliseSections(englishFallbackTranslations);
  })();

  return { toc, sections };
}
