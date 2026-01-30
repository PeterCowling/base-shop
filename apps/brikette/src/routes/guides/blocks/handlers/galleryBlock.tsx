/**
 * Gallery block handler.
 */
import ImageGallery from "@/components/guides/ImageGallery";
import ZoomableImageGallery from "@/components/guides/ZoomableImageGallery";
import { IS_DEV } from "@/config/env";
import buildCfImageUrl, { type BuildCfImageOptions } from "@acme/ui/lib/buildCfImageUrl";

import type { GuideSeoTemplateContext } from "../../guide-seo/types";
import type { GalleryBlockItem, GalleryBlockOptions } from "../types";
import { DEFAULT_IMAGE_DIMENSIONS } from "../utils/constants";
import { GALLERY_MODULES } from "../utils/moduleResolver";
import { resolveTranslation } from "../utils/stringHelpers";

import type { BlockAccumulator } from "./BlockAccumulator";

function resolveGalleryItems(
  context: GuideSeoTemplateContext,
  options: GalleryBlockOptions,
  fallbackTitle: string,
): GalleryBlockItem[] {
  if (Array.isArray(options.items) && options.items.length > 0) {
    return options.items.map((item) => ({
      ...item,
      alt:
        resolveTranslation(context.translateGuides, item.altKey, item.alt) ??
        resolveTranslation(context.translateGuides, `content.${context.guideKey}.gallery.primaryAlt`, item.alt) ??
        fallbackTitle,
      caption:
        resolveTranslation(context.translateGuides, item.captionKey, item.caption) ??
        resolveTranslation(context.translateGuides, `content.${context.guideKey}.gallery.primaryCaption`, item.caption) ??
        undefined,
    }));
  }
  if (options.source) {
    const matchedKey = Object.keys(GALLERY_MODULES).find(
      (key) =>
        key.endsWith(`${options.source}.gallery.ts`) || key.endsWith(`${options.source}.gallery.tsx`),
    );
    if (matchedKey) {
      const mod = GALLERY_MODULES[matchedKey] as Record<string, unknown>;
      const candidate =
        typeof mod["buildGuideGallery"] === "function"
          ? mod["buildGuideGallery"]
          : typeof mod["buildGallery"] === "function"
            ? mod["buildGallery"]
            : typeof mod["default"] === "function"
              ? mod["default"]
              : undefined;
      if (typeof candidate === "function") {
        try {
          const translator = context.translateGuides;
          const englishTranslator =
            typeof context.translateGuides.bind === "function"
              ? (context.translateGuides.bind(null, "en") as GuideSeoTemplateContext["translateGuides"])
              : undefined;
          const result = candidate({
            translator,
            englishTranslator: englishTranslator ?? translator,
            hero: context.ogImage.url,
            ogImage: context.ogImage.url,
            fallbackTitle,
          });
          if (Array.isArray(result)) {
            return result as GalleryBlockItem[];
          }
        } catch {
          // swallow and fall through to empty array
        }
      }
    }

    // Fallback: If no module found, try reading directly from translations
    try {
      // Try different approaches to get the raw gallery data
      const contentKey = `content.${options.source}.gallery`;

      // Approach 1: returnObjects
      let galleryData = context.translateGuides(contentKey, { returnObjects: true });

      // Approach 2: Try without the content prefix (just the guide key + gallery)
      if (!Array.isArray(galleryData)) {
        galleryData = context.translateGuides(`${options.source}.gallery`, { returnObjects: true });
      }

      // Approach 3: Try accessing via i18n instance directly
      if (!Array.isArray(galleryData) && typeof context.translateGuides === 'function') {
        // Access the i18n instance if available
        const i18nInstance = (context.translateGuides as any).i18n;
        if (i18nInstance?.store?.data) {
          const currentLang = context.lang || 'en';
          const store = i18nInstance.store.data[currentLang];
          if (store?.guides?.[options.source]?.gallery) {
            galleryData = store.guides[options.source].gallery;
          }
        }
      }

      if (Array.isArray(galleryData)) {
        return galleryData.map((item: Record<string, unknown>) => ({
          image: (item.src ?? item.image) as string,
          alt: (item.alt ?? fallbackTitle) as string,
          caption: item.caption as string | undefined,
          width: item.width as number | undefined,
          height: item.height as number | undefined,
        })).filter(item => item.image);
      }
    } catch (err) {
      if (IS_DEV) console.debug('[galleryBlock] Failed to read gallery from translations:', err);
    }
  }
  return [];
}

export function applyGalleryBlock(acc: BlockAccumulator, options: GalleryBlockOptions): void {
  acc.addSlot("article", (context: GuideSeoTemplateContext) => {
    const fallbackTitle = context.article.title;
    const items = resolveGalleryItems(context, options, fallbackTitle);
    if (items.length === 0) return null;

    const heading =
      resolveTranslation(context.translateGuides, options.headingKey) ??
      resolveTranslation(context.translateGuides, `content.${context.guideKey}.gallery.heading`);

    const resolvedItems = items.map((item) => {
      const width = item.width ?? DEFAULT_IMAGE_DIMENSIONS.width;
      const height = item.height ?? DEFAULT_IMAGE_DIMENSIONS.height;
      const cfOptions: BuildCfImageOptions = {
        width,
        height,
        quality: item.quality ?? DEFAULT_IMAGE_DIMENSIONS.quality,
        format: item.format ?? DEFAULT_IMAGE_DIMENSIONS.format,
      };
      return {
        src: buildCfImageUrl(item.image, cfOptions),
        alt: item.alt ?? fallbackTitle,
        ...(typeof item.caption === "string" && item.caption.length > 0 ? { caption: item.caption } : {}),
        width,
        height,
      };
    });

    // Conditionally use zoomable variant (TASK-03)
    const GalleryComponent = options.zoomable === true ? ZoomableImageGallery : ImageGallery;

    return (
      <section className="space-y-4">
        {heading ? <h2 className="text-2xl font-semibold">{heading}</h2> : null}
        <GalleryComponent items={resolvedItems} />
      </section>
    );
  });
}
