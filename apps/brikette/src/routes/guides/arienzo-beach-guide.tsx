// src/routes/guides/arienzo-beach-guide.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import ImageGallery from "@/components/guides/ImageGallery";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import {
  getGuideManifestEntry,
  type GuideAreaSlugKey,
  guideAreaToSlugKey,
} from "./guide-manifest";
import type { GuideSeoTemplateProps } from "./guide-seo/types";

export const handle = { tags: ["beaches", "positano", "tips"] };

export const GUIDE_KEY = "arienzoBeachClub" as const satisfies GuideKey;
export const GUIDE_SLUG = "arienzo-beach-guide" as const;

const OG_IMAGE = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto" as const,
  },
} as const;

const GALLERY_SOURCES = [
  "/img/guides/arienzo-beach/image1.jpg",
  "/img/guides/arienzo-beach/image2.jpg",
] as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for arienzoBeachClub"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
}

const { Component, clientLoader, meta: baseMeta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleExtras: buildArienzoGalleryExtras,
    renderGenericContent: true,
    preferGenericWhenFallback: true,
    genericContentOptions: { showToc: true },
  }),
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    guideAreaToSlugKey(manifestEntry.primaryArea),
    manifestEntry.status === "live",
  ),
});

export default Component;
export { clientLoader };
export const meta: MetaFunction = (...args) => baseMeta(...args);
export const links: LinksFunction = () => buildRouteLinks();

function buildArienzoGalleryExtras(
  context: Parameters<NonNullable<GuideSeoTemplateProps["articleExtras"]>>[0],
) {
  const title = translateWithFallback(context.translateGuides, `content.${GUIDE_KEY}.galleryHeading`);
  const primaryAlt = translateWithFallback(context.translateGuides, `content.${GUIDE_KEY}.gallery.primaryAlt`);
  const primaryCaption = translateWithFallback(
    context.translateGuides,
    `content.${GUIDE_KEY}.gallery.primaryCaption`,
  );
  const secondaryAlt = translateWithFallback(context.translateGuides, `content.${GUIDE_KEY}.gallery.secondaryAlt`);
  const secondaryCaption = translateWithFallback(
    context.translateGuides,
    `content.${GUIDE_KEY}.gallery.secondaryCaption`,
  );

  const items = [
    { src: GALLERY_SOURCES[0], alt: primaryAlt, caption: primaryCaption },
    { src: GALLERY_SOURCES[1], alt: secondaryAlt, caption: secondaryCaption },
  ]
    .filter((item) => item.src && item.alt && item.caption)
    .map((item) => ({
      ...item,
      src: buildCfImageUrl(item.src, { width: 1200, height: 800, quality: 85, format: "auto" }),
    }));

  if (items.length === 0) return null;
  return (
    <section id="gallery">
      {title ? <h2>{title}</h2> : null}
      <ImageGallery items={items} />
    </section>
  );
}

function translateWithFallback(translate: (key: string, options?: Record<string, unknown>) => unknown, key: string): string {
  const primary = translate(key);
  if (typeof primary === "string") {
    const trimmed = primary.trim();
    if (trimmed.length > 0 && trimmed !== key) return trimmed;
  }
  try {
    const fallback = i18n.getFixedT("en", "guides")?.(key);
    if (typeof fallback === "string") {
      const trimmed = fallback.trim();
      if (trimmed.length > 0 && trimmed !== key) return trimmed;
    }
  } catch {
    // ignore fallback failures
  }
  return "";
}

function buildMeta(metaKey: string, areaSlugKey: GuideAreaSlugKey, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? ("en" as AppLanguage);
    const areaSlug = getSlug(areaSlugKey, lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, GUIDE_KEY)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${metaKey}.title`,
      description: `guides.meta.${metaKey}.description`,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished,
    });
  };
}
