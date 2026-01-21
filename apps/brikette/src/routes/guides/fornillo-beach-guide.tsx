// src/routes/guides/fornillo-beach-guide.tsx
import type { LinksFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export const handle = { tags: ["beaches", "positano", "tips"] };

export const GUIDE_KEY = "fornilloBeachGuide" as const satisfies GuideKey;
export const GUIDE_SLUG = "fornillo-beach-guide" as const;

const RELATED_GUIDES = [
  { key: "hostelBriketteToFornilloBeach" },
  { key: "fornilloBeachToBrikette" },
  { key: "positanoBeaches" },
] as const;

const OG_IMAGE_CONFIG = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: OG_IMAGE.width,
  height: OG_IMAGE.height,
  transform: {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  },
} as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for fornilloBeachGuide"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
}

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    relatedGuides: { items: RELATED_GUIDES.map((item) => ({ key: item.key })) },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const areaSlug = getSlug(baseKey, lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
    const image = buildCfImageUrl(OG_IMAGE_CONFIG.path, OG_IMAGE_CONFIG.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE_CONFIG.width, height: OG_IMAGE_CONFIG.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (
  ...linkArgs: Parameters<LinksFunction>
) => {
  const descriptors = baseLinks(...linkArgs);
  return Array.isArray(descriptors) && descriptors.length > 0 ? descriptors : buildRouteLinks();
};
