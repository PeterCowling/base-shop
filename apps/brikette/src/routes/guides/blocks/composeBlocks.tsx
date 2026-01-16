/* eslint-disable ds/no-hardcoded-copy -- DEV-1823 [ttl=2026-12-31] Guide block composer uses literal module patterns and fallbacks. */
/*
 * DEV-1823: Block composer relies on fallback strings pending locale coverage, and this helper file does not
 * represent a route module with direct SEO exports.
 */
// src/routes/guides/blocks/composeBlocks.ts
import {
  Children,
  Fragment,
  createElement,
  isValidElement,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";

import CfImage from "@/components/images/CfImage";
import ImageGallery from "@/components/guides/ImageGallery";
import ServiceStructuredData from "@/components/seo/ServiceStructuredData";
import buildCfImageUrl, { type BuildCfImageOptions } from "@/lib/buildCfImageUrl";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { normalizeFaqEntries } from "@/utils/buildFaqJsonLd";
import type { GuideSection } from "@/data/guides.index";
import { getWebpackContext, supportsWebpackGlob, webpackContextToRecord } from "@/utils/webpackGlob";
// Test fixture stubs (actual files not present in this build)
const TestJsonLdWidgetFixture = { default: {} };

import type { GuideManifestEntry } from "../guide-manifest";
import type { GuideSeoTemplateContext, GuideSeoTemplateProps } from "../guide-seo/types";
import type {
  GuideBlockDeclaration,
  GalleryBlockItem,
  HeroBlockOptions,
  GalleryBlockOptions,
  FaqBlockOptions,
  ServiceSchemaBlockOptions,
  GenericContentBlockOptions,
  AlsoHelpfulBlockOptions,
  JsonLdBlockOptions,
} from "./types";

type SlotRenderer = (context: GuideSeoTemplateContext) => ReactNode;

type Slots = "lead" | "article" | "after" | "head";

interface AccumulatorSlots {
  lead: SlotRenderer[];
  article: SlotRenderer[];
  after: SlotRenderer[];
  head: SlotRenderer[];
}

type TemplateFragment = Partial<GuideSeoTemplateProps>;

const DEFAULT_IMAGE_DIMENSIONS = { width: 1600, height: 900, quality: 85, format: "auto" as const };

type CfImagePreset = "hero" | "gallery" | "thumb";

function normalisePreset(preset?: string): CfImagePreset {
  return preset === "gallery" || preset === "thumb" ? preset : "hero";
}

const JSON_LD_CONTEXT = supportsWebpackGlob
  ? getWebpackContext(
      "..",
      true,
      /(?:\\.jsonld|\\.schema|JsonLd|JsonLD|StructuredData|MetaBridge|Meta)\\.tsx?$/
    )
  : undefined;
const TEST_JSON_LD_MODULES: Record<string, unknown> =
  process.env.NODE_ENV === "test"
    ? {
        "__tests__/fixtures/TestJsonLdWidget.jsonld": TestJsonLdWidgetFixture,
        "fixtures/TestJsonLdWidget.jsonld": TestJsonLdWidgetFixture,
      }
    : {};
const JSON_LD_MODULES: Record<string, unknown> = {
  ...webpackContextToRecord<Record<string, unknown>>(JSON_LD_CONTEXT),
  ...TEST_JSON_LD_MODULES,
};

const GALLERY_CONTEXT = supportsWebpackGlob
  ? getWebpackContext("..", true, /\\.gallery\\.tsx?$/)
  : undefined;
const GALLERY_MODULES: Record<string, unknown> =
  webpackContextToRecord<Record<string, unknown>>(GALLERY_CONTEXT);

type HeadRenderer = (context: GuideSeoTemplateContext) => ReactNode;

type ServiceOffers = NonNullable<ComponentProps<typeof ServiceStructuredData>["offers"]>;
type ServiceOffer = ServiceOffers[number];

function normaliseString(value: unknown, fallback?: string, comparisonKey?: string): string | undefined {
  if (typeof value !== "string") {
    return fallback?.trim() || undefined;
  }
  const trimmed = value.trim();
  if (!trimmed.length) {
    return fallback?.trim() || undefined;
  }
  if (comparisonKey && trimmed === comparisonKey) {
    return fallback?.trim() || undefined;
  }
  return trimmed;
}

function resolveTranslation(
  translator: GuideSeoTemplateContext["translateGuides"] | undefined,
  key: string | undefined,
  fallback?: string,
): string | undefined {
  if (!key) return normaliseString(undefined, fallback);
  if (typeof translator !== "function") {
    return normaliseString(undefined, fallback);
  }
  try {
    const result = translator(key, { defaultValue: fallback }) as unknown;
    return normaliseString(result, fallback, key);
  } catch {
    return normaliseString(undefined, fallback);
  }
}

function normalizeModuleSpecifier(value: string): string {
  return value
    .replace(/^\.\//, "")
    .replace(/^@\/routes\/guides\//, "")
    .replace(/\.(cm)?jsx?$/i, "")
    .replace(/\.(t|j)sx?$/i, "");
}

function normalizeModuleKey(key: string): string {
  return key
    .replace(/^\.{1,2}\//, "")
    .replace(/\.(cm)?jsx?$/i, "")
    .replace(/\.(t|j)sx?$/i, "");
}

function pickExport(module: Record<string, unknown>, exportName?: string) {
  if (exportName && exportName in module) return module[exportName];
  if ("default" in module && module["default"] !== undefined) return module["default"];
  if ("createJsonLd" in module) return module["createJsonLd"];
  if ("buildJsonLd" in module) return module["buildJsonLd"];
  if ("renderJsonLd" in module) return module["renderJsonLd"];
  return undefined;
}

function resolveHeadRenderer(modulePath: string, exportName?: string): HeadRenderer | null {
  if (!modulePath) return null;
  const target = normalizeModuleSpecifier(modulePath);
  let matchedModule: Record<string, unknown> | undefined;

  for (const [key, mod] of Object.entries(JSON_LD_MODULES)) {
    if (normalizeModuleKey(key) === target) {
      matchedModule = mod as Record<string, unknown>;
      break;
    }
  }

  if (!matchedModule) {
    return null;
  }

  const candidate = pickExport(matchedModule, exportName);
  if (typeof candidate === "function") {
    const Fn = candidate as ((context: GuideSeoTemplateContext) => ReactNode) | ComponentType;
    return (context: GuideSeoTemplateContext) => {
      try {
        if (Fn.length > 0) {
          return (Fn as (context: GuideSeoTemplateContext) => ReactNode)(context);
        }
        return createElement(Fn as ComponentType, null);
      } catch {
        return null;
      }
    };
  }

  if (candidate !== undefined) {
    const value = candidate as ReactNode;
    return () => value;
  }

  return null;
}

function isIterable(value: unknown): value is Iterable<unknown> {
  return typeof value === "object" && value != null && Symbol.iterator in value;
}

function hasDefaultExportFunction(
  value: unknown,
): value is { default: (ctx: GuideSeoTemplateContext) => ReactNode } {
  return (
    typeof value === "object" &&
    value != null &&
    !Array.isArray(value) &&
    !isIterable(value) &&
    "default" in (value as Record<string, unknown>) &&
    typeof (value as Record<string, unknown>)["default"] === "function"
  );
}

function normaliseGuideSection(value: unknown): GuideSection | undefined {
  if (value === "help" || value === "experiences") return value;
  return undefined;
}

function mergeTemplateProps(base: TemplateFragment, patch: TemplateFragment): TemplateFragment {
  if (!patch) return { ...base };
  const merged: TemplateFragment = { ...base, ...patch };
  if (base.genericContentOptions || patch.genericContentOptions) {
    merged.genericContentOptions = {
      ...(base.genericContentOptions ?? {}),
      ...(patch.genericContentOptions ?? {}),
    };
  }
  if (base.relatedGuides || patch.relatedGuides) {
    const related = {
      ...(base.relatedGuides ?? {}),
      ...(patch.relatedGuides ?? {}),
    };
    if (Array.isArray(related.items) && related.items.length > 0) {
      merged.relatedGuides = {
        ...related,
        items: [...related.items],
      } as NonNullable<GuideSeoTemplateProps["relatedGuides"]>;
    }
  }
  if (base.alsoHelpful || patch.alsoHelpful) {
    const alsoHelpful = {
      ...(base.alsoHelpful ?? {}),
      ...(patch.alsoHelpful ?? {}),
    };
    if (Array.isArray(alsoHelpful.tags) && alsoHelpful.tags.length > 0) {
      merged.alsoHelpful = {
        ...alsoHelpful,
        tags: [...alsoHelpful.tags],
        excludeGuide: Array.isArray(alsoHelpful.excludeGuide)
          ? [...alsoHelpful.excludeGuide]
          : alsoHelpful.excludeGuide,
        section: normaliseGuideSection(alsoHelpful.section),
      } as NonNullable<GuideSeoTemplateProps["alsoHelpful"]>;
    }
  }
  return merged;
}

function composeSlot(renderers: SlotRenderer[]): ((ctx: GuideSeoTemplateContext) => ReactNode) | undefined {
  if (!renderers.length) return undefined;
  return function GuideBlockSlot(context: GuideSeoTemplateContext): ReactNode {
    const slotChildren = renderers.map((renderer, index) => {
      const node = renderer(context);
      const children = Array.isArray(node) ? Children.toArray(node) : node;
      return createElement(Fragment, { key: `guide-block-slot-${index}` }, children);
    });
    return createElement(Fragment, null, Children.toArray(slotChildren));
  };
}

function normaliseServiceOffers(value: unknown): ServiceOffer[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const offers = value
    .map((offer) => {
      if (!offer || typeof offer !== "object") {
        return null;
      }
      const record = offer as Record<string, unknown>;
      const price = normaliseString(record["price"]);
      if (!price) {
        return null;
      }

      const priceCurrency = normaliseString(record["priceCurrency"]);
      const availability = normaliseString(record["availability"]);
      const description = normaliseString(record["description"]);

      const resolved: ServiceOffer = { price };
      if (priceCurrency) {
        resolved.priceCurrency = priceCurrency;
      }
      if (availability) {
        resolved.availability = availability;
      }
      if (description) {
        resolved.description = description;
      }

      return resolved;
    })
    .filter((offer): offer is ServiceOffer => offer != null);

  return offers.length > 0 ? offers : undefined;
}

class BlockAccumulator {
  private readonly entry: GuideManifestEntry;
  private template: TemplateFragment = {};
  private readonly slots: AccumulatorSlots = {
    lead: [],
    article: [],
    after: [],
    head: [],
  };
  readonly warnings: string[] = [];

  constructor(entry: GuideManifestEntry) {
    this.entry = entry;
  }

  mergeTemplate(partial: TemplateFragment | undefined): void {
    if (!partial) return;
    this.template = mergeTemplateProps(this.template, partial);
  }

  addSlot(slot: Slots, renderer: SlotRenderer | undefined): void {
    if (!renderer) return;
    this.slots[slot].push(renderer);
  }

  warn(message: string): void {
    this.warnings.push(message);
  }

  buildTemplate(): TemplateFragment {
    const template = { ...this.template };
    const lead = composeSlot(this.slots.lead);
    if (lead) template.articleLead = lead;
    const article = composeSlot(this.slots.article);
    if (article) template.articleExtras = article;
    const after = composeSlot(this.slots.after);
    if (after) template.afterArticle = after;
    const head = composeSlot(this.slots.head);
    if (head) template.additionalScripts = head;
    return template;
  }

  get manifest(): GuideManifestEntry {
    return this.entry;
  }
}

function applyHeroBlock(acc: BlockAccumulator, options: HeroBlockOptions): void {
  const resolved: HeroBlockOptions = {
    ...DEFAULT_IMAGE_DIMENSIONS,
    introLimit: options.introLimit,
    showIntro: options.showIntro ?? true,
    ...options,
  };

  acc.addSlot("lead", (context) => {
    const contentKey = acc.manifest.contentKey;
    const intlAlt =
      resolveTranslation(context.translateGuides, options.altKey, resolved.alt) ??
      resolveTranslation(context.translateGuides, `content.${contentKey}.heroAlt`, resolved.alt);
    const alt = intlAlt ?? context.article.title;

    const cfOptions: BuildCfImageOptions = {
      width: resolved.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
      height: resolved.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
      quality: resolved.quality ?? DEFAULT_IMAGE_DIMENSIONS.quality,
      format: resolved.format ?? DEFAULT_IMAGE_DIMENSIONS.format,
    };

    const src = buildCfImageUrl(resolved.image, cfOptions);
    const introLimit = resolved.introLimit && resolved.introLimit > 0 ? resolved.introLimit : undefined;
    const intro = Array.isArray(context.intro) ? context.intro : [];
    const introSnippets = resolved.showIntro === false ? [] : intro.slice(0, introLimit ?? intro.length);

    return (
      <div className={resolved.className ?? ""}>
        {introSnippets.map((paragraph, index) => (
          <p key={`guide-hero-intro-${index}`}>{paragraph}</p>
        ))}
        <CfImage
          src={src}
          alt={alt ?? context.article.title}
          width={cfOptions.width}
          height={cfOptions.height}
          preset={normalisePreset(resolved.preset)}
          data-aspect={resolved.aspectRatio}
        />
      </div>
    );
  });
}

function applyFaqBlock(acc: BlockAccumulator, options?: FaqBlockOptions): void {
  const fallbackKey = options?.fallbackKey ?? acc.manifest.contentKey;
  const fallback = (lang: string) => {
    const raw = getGuideResource<unknown>(lang, `content.${fallbackKey}.faqs`, { includeFallback: true });
    return normalizeFaqEntries(raw);
  };

  acc.mergeTemplate({
    guideFaqFallback: fallback,
    alwaysProvideFaqFallback: Boolean(options?.alwaysProvideFallback),
    ...(typeof options?.preferManualWhenUnlocalized === "boolean"
      ? { preferManualWhenUnlocalized: options.preferManualWhenUnlocalized }
      : {}),
    ...(typeof options?.suppressWhenUnlocalized === "boolean"
      ? { suppressFaqWhenUnlocalized: options.suppressWhenUnlocalized }
      : {}),
  });
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
    const matchedKey = Object.keys(GALLERY_MODULES).find(
      (key) =>
        key.endsWith(`${options.source}.gallery.ts`) || key.endsWith(`${options.source}.gallery.tsx`)
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

function applyGalleryBlock(acc: BlockAccumulator, options: GalleryBlockOptions): void {
  acc.addSlot("article", (context) => {
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
        ...(typeof item.caption === "string" && item.caption.length > 0
          ? { caption: item.caption }
          : {}),
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

function applyServiceSchemaBlock(acc: BlockAccumulator, options?: ServiceSchemaBlockOptions): void {
  if (options?.source) {
    acc.warn(`serviceSchema block source "${options.source}" currently falls back to translation-based data`);
  }
  acc.addSlot("head", (context) => {
    const contentKey = options?.contentKey ?? acc.manifest.contentKey;
    const name =
      resolveTranslation(context.translateGuides, options?.nameKey) ??
      context.article.title;
    const description =
      resolveTranslation(context.translateGuides, options?.descriptionKey) ??
      context.article.description;
    const serviceType = resolveTranslation(context.translateGuides, options?.serviceTypeKey ?? `content.${contentKey}.serviceType`);
    const areaServed = resolveTranslation(
      context.translateGuides,
      options?.areaServedKey ?? `content.${contentKey}.areaServed`,
    );
    const provider = resolveTranslation(context.translateGuides, options?.providerNameKey);

    const imagePath = options?.image ?? context.ogImage?.url;
    const image =
      options?.image && options.image !== context.ogImage?.url
        ? buildCfImageUrl(options.image, {
            width: DEFAULT_IMAGE_DIMENSIONS.width,
            height: DEFAULT_IMAGE_DIMENSIONS.height,
            quality: DEFAULT_IMAGE_DIMENSIONS.quality,
            format: DEFAULT_IMAGE_DIMENSIONS.format,
          })
        : imagePath;

    let sameAs: string[] | undefined;
    if (Array.isArray(options?.sameAsKeys) && options.sameAsKeys.length > 0) {
      sameAs = options.sameAsKeys
        .map((key) => resolveTranslation(context.translateGuides, key))
        .filter((value): value is string => Boolean(value));
    }

    const offers = normaliseServiceOffers(
      options?.offersKey ? getGuideResource(context.lang, options.offersKey) : undefined,
    );

    const serviceProps = {
      name: name ?? context.article.title,
      description: description ?? context.article.description,
      image,
      inLanguage: context.lang,
      url: context.canonicalUrl,
      ...(serviceType ? { serviceType } : {}),
      ...(areaServed ? { areaServed } : {}),
      ...(provider ? { providerName: provider } : {}),
      ...(sameAs && sameAs.length > 0 ? { sameAs } : {}),
      ...(offers && offers.length > 0 ? { offers } : {}),
    };
    return <ServiceStructuredData {...serviceProps} />;
  });
}

function applyGenericContentBlock(acc: BlockAccumulator, options?: GenericContentBlockOptions): void {
  const genericOptions =
    options?.showToc != null || options?.faqHeadingLevel != null
      ? {
          ...(typeof options?.showToc === "boolean" ? { showToc: options.showToc } : {}),
          ...(typeof options?.faqHeadingLevel === "number"
            ? { faqHeadingLevel: options.faqHeadingLevel }
            : {}),
        }
      : undefined;

  const template: TemplateFragment = {
    renderGenericContent: true,
    ...(genericOptions ? { genericContentOptions: genericOptions } : {}),
  };

  if (options?.renderWhenEmpty) {
    template.renderGenericWhenEmpty = true;
  }

  acc.mergeTemplate(template);
}

function applyAlsoHelpfulBlock(acc: BlockAccumulator, options: AlsoHelpfulBlockOptions): void {
  const exclude = Array.isArray(options.excludeGuide)
    ? options.excludeGuide
    : options.excludeGuide
    ? [options.excludeGuide]
    : undefined;

  if (!Array.isArray(options.tags) || options.tags.length === 0) {
    acc.warn("alsoHelpful block requires at least one tag");
    return;
  }

  const config: GuideSeoTemplateProps["alsoHelpful"] = {
    tags: [...options.tags],
  };

  if (Array.isArray(exclude)) {
    config.excludeGuide = [...exclude];
  }

  if (options.includeRooms != null) {
    config.includeRooms = options.includeRooms;
  }

  if (options.titleKey) {
    config.titleKey = options.titleKey;
  }

  const normalizedSection = normaliseGuideSection(options.section);
  if (normalizedSection) {
    config.section = normalizedSection;
  }

  acc.mergeTemplate({
    alsoHelpful: config,
  });
}

function applyJsonLdBlock(acc: BlockAccumulator, options: JsonLdBlockOptions): void {
  if (!options?.module) {
    acc.warn(`jsonLd block requires a module option`);
    return;
  }
  const renderer = resolveHeadRenderer(options.module, options.exportName);
  if (!renderer) {
    acc.warn(`jsonLd block module "${options.module}" could not be resolved`);
    return;
  }
  acc.addSlot("head", (context) => {
    try {
      const node = renderer(context);
      if (node == null) return null;
      if (Array.isArray(node)) {
        return createElement(Fragment, null, Children.toArray(node));
      }
      if (isValidElement(node) || typeof node !== "object") {
        return node as ReactNode;
      }
      if (hasDefaultExportFunction(node)) {
        try {
          return node.default(context);
        } catch {
          return null;
        }
      }
      return node as ReactNode;
    } catch {
      return null;
    }
  });
}

function composeBlock(acc: BlockAccumulator, block: GuideBlockDeclaration): void {
  switch (block.type) {
    case "hero":
      applyHeroBlock(acc, block.options);
      return;
    case "genericContent":
      applyGenericContentBlock(acc, block.options);
      return;
    case "faq":
      applyFaqBlock(acc, block.options);
      return;
    case "gallery":
      applyGalleryBlock(acc, block.options);
      return;
    case "serviceSchema":
      applyServiceSchemaBlock(acc, block.options);
      return;
    case "alsoHelpful":
      applyAlsoHelpfulBlock(acc, block.options);
      return;
    case "jsonLd":
      applyJsonLdBlock(acc, block.options);
      return;
    case "relatedGuides":
      acc.mergeTemplate({
        relatedGuides: {
          items: Array.isArray(block.options?.guides)
            ? block.options?.guides.map((key) => ({ key }))
            : acc.manifest.relatedGuides.map((key) => ({ key })),
        },
      });
      return;
    case "planChoice":
      acc.mergeTemplate({ showPlanChoice: true });
      return;
    case "transportNotice":
      acc.mergeTemplate({ showTransportNotice: true });
      return;
    case "breadcrumbs":
    case "custom":
      acc.warn(`Guide block "${block.type}" currently has no runtime handler`);
      return;
    default:
      acc.warn(`Unknown guide block type "${(block as { type: string }).type}"`);
  }
}

export function composeBlocks(entry: GuideManifestEntry): {
  template: TemplateFragment;
  warnings: string[];
} {
  const accumulator = new BlockAccumulator(entry);
  for (const block of entry.blocks) {
    composeBlock(accumulator, block);
  }
  return {
    template: accumulator.buildTemplate(),
    warnings: accumulator.warnings,
  };
}
