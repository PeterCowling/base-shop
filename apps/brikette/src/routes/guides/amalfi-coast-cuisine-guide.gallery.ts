// src/routes/guides/amalfi-coast-cuisine-guide.gallery.ts
import type { TFunction } from "i18next";

import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { ensureArray } from "@/utils/i18nContent";

import {
  GALLERY_SOURCES,
  GUIDE_KEY,
  type GalleryTranslation,
} from "./amalfi-coast-cuisine-guide.constants";
import type { EnglishFallbacks } from "./amalfi-coast-cuisine-guide.fallbacks";

interface GalleryContext {
  translator: TFunction<"guides">;
  lang: string;
  englishFallbacks: EnglishFallbacks;
  hasGallery: boolean;
}

interface GalleryResult {
  title: string;
  items: { src: string; alt: string; caption?: string }[];
}

function buildGalleryTranslations(
  translator: TFunction<"guides">,
  hasGallery: boolean,
): GalleryTranslation[] {
  if (!hasGallery) {
    return [];
  }

  return ensureArray<GalleryTranslation>(
    translator(`content.${GUIDE_KEY}.gallery.items`, { returnObjects: true }),
  );
}

function resolveGalleryTitle(translator: TFunction<"guides">, englishFallbackTitle: string): string {
  const galleryTitleRaw = translator(`content.${GUIDE_KEY}.gallery.title`, { defaultValue: "" });
  const fallbackGalleryTitleRaw = translator(`fallbacks.${GUIDE_KEY}.galleryTitle`, {
    defaultValue: englishFallbackTitle,
  });

  const galleryTitleCandidate =
    typeof galleryTitleRaw === "string" && galleryTitleRaw.trim().length > 0
      ? galleryTitleRaw.trim()
      : undefined;
  const fallbackGalleryTitleCandidate =
    typeof fallbackGalleryTitleRaw === "string" && fallbackGalleryTitleRaw.trim().length > 0
      ? fallbackGalleryTitleRaw.trim()
      : undefined;

  return galleryTitleCandidate ?? fallbackGalleryTitleCandidate ?? englishFallbackTitle;
}

function mapGalleryItems(
  translations: GalleryTranslation[],
  fallbackItems: GalleryTranslation[],
): { src: string; alt: string; caption?: string }[] {
  return GALLERY_SOURCES.map((src, index) => {
    const translation = translations[index] ?? {};
    const fallback = fallbackItems[index] ?? fallbackItems[0] ?? {};
    const alt =
      typeof translation.alt === "string" && translation.alt.trim().length > 0
        ? translation.alt.trim()
        : typeof fallback.alt === "string"
        ? fallback.alt
        : "";
    const caption =
      typeof translation.caption === "string" && translation.caption.trim().length > 0
        ? translation.caption.trim()
        : typeof fallback.caption === "string" && fallback.caption.trim().length > 0
        ? fallback.caption.trim()
        : undefined;

    return {
      src: buildCfImageUrl(src, { width: 1200, height: 800, quality: 85, format: "auto" }),
      alt,
      ...(caption ? { caption } : {}),
    };
  }).filter((item) => item.alt.length > 0);
}

export function buildCuisineGallery(context: GalleryContext): GalleryResult {
  const translations = buildGalleryTranslations(context.translator, context.hasGallery);
  const title = resolveGalleryTitle(context.translator, context.englishFallbacks.galleryTitle);
  const fallbackItems = context.englishFallbacks.galleryItems;

  const items =
    context.hasGallery || context.lang === "en"
      ? mapGalleryItems(translations, fallbackItems)
      : [];

  return { title, items };
}
