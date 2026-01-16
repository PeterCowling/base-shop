/* eslint-disable import/require-twitter-card, import/require-xdefault-canonical -- TECH-000: Non-route block renderer; head tags are defined by the guide route meta()/links() exports per src/routes/AGENTS.md §3 */
import ImageGallery from "@/components/guides/ImageGallery";
import buildCfImageUrl, { type BuildCfImageOptions } from "@/lib/buildCfImageUrl";

import type { BlockAccumulator } from "../blockAccumulator";
import { getGalleryModule } from "../moduleRegistry";
import type { GuideSeoTemplateContext } from "../../guide-seo/types";
import type { GalleryBlockItem, GalleryBlockOptions } from "../types";
import { DEFAULT_IMAGE_DIMENSIONS, resolveTranslation } from "../utils";

type GalleryBuilderContext = {
  translator?: GuideSeoTemplateContext["translateGuides"];
  englishTranslator?: GuideSeoTemplateContext["translateGuides"];
  hero: string;
  ogImage: string;
  fallbackTitle: string;
};

type GalleryBuilder = (context: GalleryBuilderContext) => unknown;

function createTranslatorForLang(
  translator: GuideSeoTemplateContext["translateGuides"] | undefined,
  lang: string,
): GuideSeoTemplateContext["translateGuides"] | undefined {
  if (typeof translator !== "function") return undefined;
  type TranslatorArgs = Parameters<GuideSeoTemplateContext["translateGuides"]>;
  type TranslatorOptionObject = Extract<TranslatorArgs[1], Record<string, unknown>>;
  return ((key: TranslatorArgs[0], options?: TranslatorArgs[1]) => {
    const baseOptions: Record<string, unknown> =
      options && typeof options === "object" ? { ...(options as Record<string, unknown>) } : {};
    const nextOptions = { ...baseOptions, lng: lang } as TranslatorOptionObject;
    return translator(key, nextOptions as TranslatorArgs[1]);
  }) as GuideSeoTemplateContext["translateGuides"];
}

function createTranslatorForLang(
  translator: GuideSeoTemplateContext["translateGuides"] | undefined,
  lang: string,
): GuideSeoTemplateContext["translateGuides"] | undefined {
  if (typeof translator !== "function") return undefined;
  type TranslatorArgs = Parameters<GuideSeoTemplateContext["translateGuides"]>;
  return ((key: TranslatorArgs[0], options?: TranslatorArgs[1]) => {
    const nextOptions =
      options && typeof options === "object"
        ? { ...(options as Record<string, unknown>), lng: lang }
        : { lng: lang };
    return translator(key, nextOptions as TranslatorArgs[1]);
  }) as GuideSeoTemplateContext["translateGuides"];
}

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
    const mod = getGalleryModule(options.source) as Record<string, GalleryBuilder> | undefined;
    if (mod) {
      const candidate =
        typeof mod.buildGuideGallery === "function"
          ? mod.buildGuideGallery
          : typeof mod.buildGallery === "function"
          ? mod.buildGallery
          : typeof mod.default === "function"
          ? (mod.default as GalleryBuilder)
          : undefined;
      if (typeof candidate === "function") {
        try {
          const translator = context.translateGuides;
          const result = candidate({
            translator,
            englishTranslator: translator,
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
  acc.addSlot("article", (context) => {
    const fallbackTitle = context.article.title;
    const items = resolveGalleryItems(context, options, fallbackTitle);
    if (items.length === 0) return null;

    const heading =
      resolveTranslation(context.translateGuides, options.headingKey) ??
      resolveTranslation(context.translateGuides, `content.${context.guideKey}.gallery.heading`);

    const resolvedItems = items.map((item) => {
      const cfOptions: BuildCfImageOptions = {
        width: item.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
        height: item.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
        quality: item.quality ?? DEFAULT_IMAGE_DIMENSIONS.quality,
        format: item.format ?? DEFAULT_IMAGE_DIMENSIONS.format,
      };
      return {
        src: buildCfImageUrl(item.image, cfOptions),
        alt: item.alt ?? fallbackTitle,
        caption: item.caption,
        width: cfOptions.width,
        height: cfOptions.height,
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
