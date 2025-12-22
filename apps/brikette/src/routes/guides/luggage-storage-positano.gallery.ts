// src/routes/guides/luggage-storage-positano.gallery.ts
import type { TFunction } from "i18next";

import { resolveLuggageStorageString } from "./luggage-storage-positano.strings";

type GalleryRecord = Record<string, unknown>;

type GalleryItem = {
  src: string;
  alt: string;
  caption?: string;
};

interface BuildGalleryOptions {
  translator: TFunction<"guides">;
  englishTranslator: TFunction<"guides">;
  hero: string;
  ogImage: string;
  fallbackTitle: string;
}

const toRecord = (value: unknown): GalleryRecord =>
  value && typeof value === "object" ? (value as GalleryRecord) : {};

export function buildLuggageStorageGallery({
  translator,
  englishTranslator,
  hero,
  ogImage,
  fallbackTitle,
}: BuildGalleryOptions): GalleryItem[] {
  const galleryCopy = translator("content.luggageStorage.gallery", { returnObjects: true }) as unknown;
  const galleryFallbackCopy = englishTranslator("content.luggageStorage.gallery", { returnObjects: true }) as unknown;

  const gallery = toRecord(galleryCopy);
  const fallback = toRecord(galleryFallbackCopy);

  const primaryAlt =
    resolveLuggageStorageString(
      gallery["primaryAlt"],
      "content.luggageStorage.gallery.primaryAlt",
      fallback["primaryAlt"],
      fallbackTitle,
    ) ?? fallbackTitle;
  const primaryCaption =
    resolveLuggageStorageString(
      gallery["primaryCaption"],
      "content.luggageStorage.gallery.primaryCaption",
      fallback["primaryCaption"],
    ) ?? undefined;

  const secondaryAlt =
    resolveLuggageStorageString(
      gallery["secondaryAlt"],
      "content.luggageStorage.gallery.secondaryAlt",
      fallback["secondaryAlt"],
      fallbackTitle,
    ) ?? fallbackTitle;
  const secondaryCaption =
    resolveLuggageStorageString(
      gallery["secondaryCaption"],
      "content.luggageStorage.gallery.secondaryCaption",
      fallback["secondaryCaption"],
    ) ?? undefined;

  return [
    {
      src: ogImage,
      alt: primaryAlt,
      ...(typeof primaryCaption === "string" && primaryCaption.length > 0
        ? { caption: primaryCaption }
        : {}),
    },
    {
      src: hero,
      alt: secondaryAlt,
      ...(typeof secondaryCaption === "string" && secondaryCaption.length > 0
        ? { caption: secondaryCaption }
        : {}),
    },
  ];
}
