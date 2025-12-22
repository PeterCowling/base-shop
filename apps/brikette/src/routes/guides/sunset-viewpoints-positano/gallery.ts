import buildCfImageUrl from "@/lib/buildCfImageUrl";

import type { GalleryContent } from "./types";

export const GALLERY_SOURCES = [
  buildCfImageUrl("/img/positano-sunset-chiesa-nuova.avif", {
    width: 1200,
    height: 800,
    quality: 85,
    format: "auto",
  }),
  buildCfImageUrl("/img/positano-sunset-nocelle.avif", {
    width: 1200,
    height: 800,
    quality: 85,
    format: "auto",
  }),
  buildCfImageUrl("/img/positano-sunset-spiaggia-grande.avif", {
    width: 1200,
    height: 800,
    quality: 85,
    format: "auto",
  }),
];

type GalleryItemView = {
  src: string;
  alt: string;
  caption: string;
};

type GalleryResult = {
  items: GalleryItemView[];
  title: string;
  shouldRender: boolean;
};

// Limit how many images we take from the current-locale structured content.
// We keep fallback content unrestricted to allow full curated sets in English.
const MAX_CURRENT_GALLERY_ITEMS = 2;

export function buildGalleryView(
  current: GalleryContent,
  fallback: GalleryContent,
): GalleryResult {
  const normaliseText = (value?: string) =>
    typeof value === "string" ? value.trim() : "";

  const mapItems = (items: GalleryContent["items"]): GalleryItemView[] => {
    if (GALLERY_SOURCES.length === 0) {
      return [];
    }

    return items
      .slice(0, GALLERY_SOURCES.length)
      .map((item, index) => {
        const caption = normaliseText(item.caption);
        const alt = normaliseText(item.alt);
        if (!caption || !alt) return null;

        const src = GALLERY_SOURCES[index];
        if (!src) return null;

        return {
          src,
          alt,
          caption,
        } satisfies GalleryItemView;
      })
      .filter((item): item is GalleryItemView => item !== null);
  };

  const currentItems = mapItems(current.items).slice(0, MAX_CURRENT_GALLERY_ITEMS);
  const fallbackItems = mapItems(fallback.items);
  const items = currentItems.length > 0 ? currentItems : fallbackItems;

  const title = normaliseText(current.title) || normaliseText(fallback.title);

  return {
    items,
    title,
    shouldRender: items.length > 0,
  };
}
