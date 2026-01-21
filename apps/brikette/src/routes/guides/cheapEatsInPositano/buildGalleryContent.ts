// src/routes/guides/cheapEatsInPositano/buildGalleryContent.ts
import buildCfImageUrl from "@/lib/buildCfImageUrl";

import { type GalleryCopy, type GalleryItem,GUIDE_KEY } from "./constants";
import { normalizeText } from "./normalizeText";
import type { CheapEatsTranslationContext } from "./useCheapEatsTranslationContext";

export type CheapEatsGalleryContent = {
  galleryHeading: string;
  galleryItems: GalleryItem[];
};

type BuildGalleryContentParams = {
  context: CheapEatsTranslationContext;
  title: string;
  galleryTranslations: Array<{ alt?: string; caption?: string }>;
  fallbackGalleryCopy: GalleryCopy[];
  galleryTitle?: string;
};

const gallerySources = [
  buildCfImageUrl("/img/positano-panini.avif", { width: 1200, height: 800, quality: 85, format: "auto" }),
  buildCfImageUrl("/img/positano-picnic-view.avif", { width: 1200, height: 800, quality: 85, format: "auto" }),
];

export function buildGalleryContent({
  context,
  title,
  galleryTranslations,
  fallbackGalleryCopy,
  galleryTitle,
}: BuildGalleryContentParams): CheapEatsGalleryContent {
  const { t, normalizeEnglish, englishDefaults } = context;

  const fallbackGalleryTitle =
    normalizeText(galleryTitle, `content.${GUIDE_KEY}.gallery.title`) ??
    normalizeText(t("labels.photoGallery"), "labels.photoGallery") ??
    normalizeEnglish("labels.photoGallery") ??
    englishDefaults.photoGallery;

  const galleryHeading = galleryTitle ?? fallbackGalleryTitle;

  const galleryItems = gallerySources.map((src, index) => {
    const translation = galleryTranslations[index] ?? {};
    const fallback = fallbackGalleryCopy[index] ?? fallbackGalleryCopy[0];
    const caption = translation.caption ?? fallback?.caption;
    return {
      src,
      alt: translation.alt ?? fallback?.alt ?? title,
      ...(typeof caption === "string" && caption.length > 0 ? { caption } : {}),
    } satisfies GalleryItem;
  });

  return { galleryHeading, galleryItems };
}
