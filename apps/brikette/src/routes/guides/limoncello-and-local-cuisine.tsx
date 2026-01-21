// src/routes/guides/limoncello-and-local-cuisine.tsx
import type { LinksFunction } from "react-router";

import ImageGallery, { type ImageGalleryItem } from "@/components/guides/ImageGallery";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { getGuidesBundle } from "../../locales/guides";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

export const GUIDE_KEY = "limoncelloCuisine" as const satisfies GuideKey;
export const GUIDE_SLUG = "limoncello-and-local-cuisine" as const;
const OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error(`guide manifest entry missing for ${GUIDE_KEY}`); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard
}

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    relatedGuides: { items: [{ key: "cheapEats" }, { key: "positanoTravelGuide" }] },
    articleExtras: (context) => renderLimoncelloGallery(context),
  }),
  meta: ({ data }, entry) => {
    const candidate = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(candidate.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl(OG_IMAGE.path, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: OG_IMAGE.transform.quality,
      format: OG_IMAGE.transform.format,
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (
  ...args: Parameters<LinksFunction>
) => {
  const descriptors = baseLinks(...args);
  return Array.isArray(descriptors) && descriptors.length > 0 ? descriptors : buildRouteLinks();
};

type GalleryCopy = { alt?: string; caption?: string } | undefined;

function renderLimoncelloGallery(context: GuideSeoTemplateContext): JSX.Element | null {
  const itemsRaw = context.translateGuides(`content.${GUIDE_KEY}.gallery.items`, {
    returnObjects: true,
  }) as unknown;
  const localItems = Array.isArray(itemsRaw) ? (itemsRaw as GalleryCopy[]) : [];
  const fallbackItems = resolveEnglishGalleryItems();

  const sources = [
    "/img/positano-vintage.avif",
    "/img/terrace.avif",
  ] as const;

  const galleryItems = sources.reduce<ImageGalleryItem[]>((acc, src, index) => {
    const local = localItems[index];
    const fallback = fallbackItems[index];
    const altLocal = typeof local?.alt === "string" ? local.alt.trim() : "";
    const capLocal = typeof local?.caption === "string" ? local.caption.trim() : "";
    const altFallback = typeof fallback?.alt === "string" ? fallback.alt.trim() : "";
    const capFallback = typeof fallback?.caption === "string" ? fallback.caption.trim() : "";
    const alt = context.hasLocalizedContent ? (altLocal || altFallback) : altFallback;
    const caption = context.hasLocalizedContent ? (capLocal || capFallback) : capFallback;
    if (!alt || !caption) return acc;
    acc.push({ src, alt, caption });
    return acc;
  }, []);

  if (galleryItems.length === 0) return null;

  const titleRaw = context.translateGuides(`content.${GUIDE_KEY}.gallery.title`) as unknown;
  const title = typeof titleRaw === "string" && titleRaw.trim().length > 0 ? titleRaw.trim() : undefined;

  return (
    <section id="gallery">
      {title ? <h2>{title}</h2> : null}
      <ImageGallery items={galleryItems} />
    </section>
  );
}

function resolveEnglishGalleryItems(): GalleryCopy[] {
  try {
    const fixed = i18n.getFixedT?.("en", "guides");
    const value = fixed?.(`content.${GUIDE_KEY}.gallery.items`, { returnObjects: true });
    if (Array.isArray(value)) {
      return value as GalleryCopy[];
    }
  } catch {
    // ignore and fall back to eager bundles
  }

  try {
    const bundle = getGuidesBundle("en") as { content?: Record<string, unknown> } | undefined;
    const gallery = bundle?.content?.[GUIDE_KEY as string] as Record<string, unknown> | undefined;
    const items = (gallery?.["gallery"] as Record<string, unknown> | undefined)?.["items"];
    if (Array.isArray(items)) {
      return items as GalleryCopy[];
    }
  } catch {
    // ignore fallback errors
  }

  return [];
}
