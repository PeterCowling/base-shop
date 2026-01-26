/**
 * Gallery block handler.
 */
import ImageGallery from "@/components/guides/ImageGallery";
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

    return (
      <section className="space-y-4">
        {heading ? <h2 className="text-2xl font-semibold">{heading}</h2> : null}
        <ImageGallery items={resolvedItems} />
      </section>
    );
  });
}
