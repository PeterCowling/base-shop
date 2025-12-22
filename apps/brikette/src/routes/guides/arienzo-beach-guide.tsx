// src/routes/guides/arienzo-beach-guide.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { defineGuideRoute } from "./defineGuideRoute";
import type { GuideSeoTemplateProps } from "./guide-seo/types";
import {
  getGuideManifestEntry,
  guideAreaToSlugKey,
  type GuideAreaSlugKey,
} from "./guide-manifest";

import ImageGallery from "@/components/guides/ImageGallery";
import i18n from "@/i18n";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";
import type { LinksFunction, MetaFunction } from "react-router";

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
  "/img/guides/arienzo-beach/image3.jpg",
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
  const fallbackAlt = translateWithFallback(context.translateGuides, `content.${GUIDE_KEY}.gallery.tertiaryAlt`);
  const fallbackCaption = translateWithFallback(
    context.translateGuides,
    `content.${GUIDE_KEY}.gallery.tertiaryCaption`,
  );

  const items = [
    { src: buildCfImageUrl(GALLERY_SOURCES[0], { width: 1200, height: 800, quality: 85, format: "auto" }), alt: primaryAlt, caption: primaryCaption },
    { src: buildCfImageUrl(GALLERY_SOURCES[1], { width: 1200, height: 800, quality: 85, format: "auto" }), alt: secondaryAlt, caption: secondaryCaption },
    { src: buildCfImageUrl(GALLERY_SOURCES[2], { width: 1200, height: 800, quality: 85, format: "auto" }), alt: fallbackAlt, caption: fallbackCaption },
  ].filter((item) => item.alt && item.caption);

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
