// src/routes/guides/laurito-beach-guide.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import {
  getGuideManifestEntry,
  guideAreaToSlugKey,
  type GuideAreaSlugKey,
} from "./guide-manifest";
import type {} from "@/routes/guides/_GuideSeoTemplate";

import ImageGallery from "@/components/guides/ImageGallery";
import i18n from "@/i18n";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
import type { LinksFunction, MetaFunction } from "react-router";

export const handle = { tags: ["beaches", "positano", "tips"] };

export const GUIDE_KEY = "lauritoBeachGuide" as const satisfies GuideKey;
export const GUIDE_SLUG = "laurito-beach-guide" as const;

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

const GALLERY_IMAGE_INDICES = [1, 2, 3, 4, 5] as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for lauritoBeachGuide"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
}

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleExtras: buildLauritoGallery,
  }),
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    guideAreaToSlugKey(manifestEntry.primaryArea),
    manifestEntry.status === "live",
  ),
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (
  ...args: Parameters<LinksFunction>
) => {
  const descriptors = baseLinks(...args);
  return Array.isArray(descriptors) && descriptors.length > 0 ? descriptors : buildRouteLinks();
};

function buildLauritoGallery(context: GuideSeoTemplateContext) {
  const altKey = `content.${GUIDE_KEY}.gallery.alt` as const;
  const fallbackAlt =
    translateWithFallback(context.translateGuides, altKey) || context.article.title;

  const sources = GALLERY_IMAGE_INDICES.map((index) =>
    buildCfImageUrl(`/img/guides/laurito/laurito-${index}.jpg`, {
      width: 1200,
      height: 800,
      quality: 85,
      format: "auto",
    }),
  );

  const items = sources
    .map((src) => ({ src, alt: fallbackAlt, caption: fallbackAlt }))
    .filter((item) => item.alt && item.src && item.src.length > 0);

  if (items.length === 0) return null;
  return (
    <section id="gallery">
      <ImageGallery items={items} />
    </section>
  );
}

function translateWithFallback(
  translate: (key: string, options?: Record<string, unknown>) => unknown,
  key: string,
): string {
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
    // ignore fallback errors
  }
  return "";
}

function buildMeta(metaKey: string, areaSlugKey: GuideAreaSlugKey, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
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
