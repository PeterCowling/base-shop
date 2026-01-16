// src/routes/guides/groceries-and-pharmacies-positano.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder, type GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import ImageGallery from "@/components/guides/ImageGallery";
import GuideSectionsItemListStructuredData from "@/components/seo/GuideSectionsItemListStructuredData";
import i18n from "@/i18n";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref, guideAbsoluteUrl, guideSlug } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import type { MetaFunction } from "react-router";

export const handle = { tags: ["logistics", "positano"] };

export const GUIDE_KEY = "groceriesPharmacies" as const satisfies GuideKey;
export const GUIDE_SLUG = "groceries-and-pharmacies-positano" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) throw new Error("guide manifest entry missing for groceriesPharmacies");

type GalleryItem = { src: string; alt: string; caption: string };

type GroceriesExtras = {
  hasStructured: boolean;
  fallbackParagraph: string | null;
  galleryItems: GalleryItem[];
};

const extrasCache = new WeakMap<GuideSeoTemplateContext, GroceriesExtras>();

function collectGroceriesExtras(context: GuideSeoTemplateContext): GroceriesExtras {
  if (extrasCache.has(context)) return extrasCache.get(context)!;

  const fallbackParagraph = (() => {
    if (context.hasLocalizedContent) return null;
    try {
      const key = `content.${GUIDE_KEY}.fallback` as const;
      const raw = context.translateGuides(key) as unknown;
      const paragraph = typeof raw === "string" ? raw.trim() : "";
      if (!paragraph || paragraph === key) return null;
      return paragraph;
    } catch {
      return null;
    }
  })();

  const buildItem = (index: number, src: string): GalleryItem | null => {
    const alt = context.translateGuides(`content.${GUIDE_KEY}.gallery.${index}.alt`) as unknown;
    const caption = context.translateGuides(`content.${GUIDE_KEY}.gallery.${index}.caption`) as unknown;
    const altText = typeof alt === "string" ? alt.trim() : "";
    const captionText = typeof caption === "string" ? caption.trim() : "";
    if (!altText || !captionText) return null;
    return { src, alt: altText, caption: captionText };
  };

  const galleryItems = [
    buildItem(0, buildCfImageUrl("/img/positano-panorama.avif", { width: 1200, height: 630, quality: 85, format: "auto" })),
    buildItem(1, buildCfImageUrl("/img/positano-grocery.avif", { width: 1200, height: 800, quality: 85, format: "auto" })),
  ].filter((item): item is GalleryItem => item != null);

  const extras: GroceriesExtras = {
    hasStructured: context.hasLocalizedContent,
    fallbackParagraph,
    galleryItems,
  };
  extrasCache.set(context, extras);
  return extras;
}

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: collectGroceriesExtras,
  render: (context, extras) => {
    if (context.hasLocalizedContent || !extras.fallbackParagraph) return null;
    return (
      <div className="space-y-4">
        <p>{extras.fallbackParagraph}</p>
      </div>
    );
  },
  isStructured: (extras, context) => context.hasLocalizedContent && extras.hasStructured,
  selectTocItems: () => [],
});

function buildMeta(metaKey: string, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const path = guideHref(lang, GUIDE_KEY);
    const url = guideAbsoluteUrl(lang, GUIDE_KEY);
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: 1200,
      height: 630,
      quality: 85,
      format: "auto",
    });

    let twitterCard: string | undefined;
    try {
      const fixed = i18n.getFixedT?.(lang, "translation");
      const pick = (value: unknown) => {
        const stringValue = typeof value === "string" ? value.trim() : "";
        return stringValue.length > 0 ? stringValue : undefined;
      };
      twitterCard =
        pick(typeof fixed === "function" ? fixed("meta.twitterCard") : undefined) ??
        pick(typeof fixed === "function" ? fixed("translation:meta.twitterCard") : undefined);
    } catch {
      twitterCard = undefined;
    }

    return buildRouteMeta({
      lang,
      title: `guides.meta.${metaKey}.title`,
      description: `guides.meta.${metaKey}.description`,
      url,
      path,
      image: { src: image, width: 1200, height: 630 },
      ogType: "article",
      twitterCard,
      includeTwitterUrl: true,
      isPublished,
    });
  };
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    preferManualWhenUnlocalized: true,
    suppressUnlocalizedFallback: true,
    relatedGuides: {
      items: [
        { key: "simsAtms" },
        { key: "whatToPack" },
        { key: "positanoBeaches" },
      ],
    },
    buildBreadcrumb: (context) => {
      const lang = context.lang;
      const homeLabel = (context.translateGuides("labels.homeBreadcrumb") as string) || "Home";
      const guidesLabel = (context.translateGuides("labels.guidesBreadcrumb") as string) || "Guides";
      const pageSlug = guideSlug(lang, GUIDE_KEY);
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: homeLabel, item: `${BASE_URL}/${lang}` },
          { "@type": "ListItem", position: 2, name: guidesLabel, item: `${BASE_URL}/${lang}/guides` },
          {
            "@type": "ListItem",
            position: 3,
            name: context.article.title,
            item: `${BASE_URL}/${lang}/guides/${pageSlug}`,
          },
        ],
      } as const;
    },
    additionalScripts: ({ canonicalUrl, article }) => (
      <GuideSectionsItemListStructuredData
        guideKey={GUIDE_KEY}
        canonicalUrl={canonicalUrl}
        name={article.title as string}
      />
    ),
    articleLead: (context) => structuredLead.articleLead(context),
    articleExtras: (context) => {
      const extras = collectGroceriesExtras(context);
      if (extras.galleryItems.length === 0) return null;
      return <ImageGallery items={extras.galleryItems} />;
    },
    buildTocItems: (context) => {
      const extras = structuredLead.structuredArticle.getExtras(context);
      return structuredLead.structuredArticle.selectTocItems(extras, context);
    },
  }),
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    manifestEntry.status === "live",
  ),
  links: (args: GuideLinksArgs | undefined, entry) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: AppLanguage } | undefined;
    const lang = payload?.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const path = guideHref(lang, entry.key);
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };

export function resolveMarinaString(
  translator: ((key: string) => unknown) | null | undefined,
  key: string,
): string | undefined {
  if (!translator) return undefined;
  const value = translator(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === key) return undefined;
  return trimmed;
}

export function pickMarinaContentTranslator<Fn extends (...args: unknown[]) => unknown>(
  primaryMetricA: unknown,
  primaryMetricB: unknown,
  primaryMetricC: unknown,
  fallbackMetricA: unknown,
  fallbackMetricB: unknown,
  fallbackMetricC: unknown,
  primary: Fn,
  fallback: Fn,
): Fn | null {
  const primaryHas = [primaryMetricA, primaryMetricB, primaryMetricC].some((v) => Number(v) > 0);
  const fallbackHas = [fallbackMetricA, fallbackMetricB, fallbackMetricC].some((v) => Number(v) > 0);
  if (primaryHas) return primary;
  if (fallbackHas) return fallback;
  return null;
}