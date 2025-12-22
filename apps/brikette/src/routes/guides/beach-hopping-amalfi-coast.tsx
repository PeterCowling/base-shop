// src/routes/guides/beach-hopping-amalfi-coast.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

import type {} from "@/routes/guides/_GuideSeoTemplate";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import type { LinksFunction, MetaFunction } from "react-router";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";
import { i18nConfig, type AppLanguage } from "@/i18n.config";

export const handle = { tags: ["beaches", "amalfi", "positano", "praiano", "budgeting"] };

export const GUIDE_KEY: GuideKey = "beachHoppingAmalfi";
export const GUIDE_SLUG = "beach-hopping-amalfi-coast" as const;

const RELATED_GUIDES = [
  { key: "beaches" },
  { key: "capriDayTrip" },
  { key: "dayTripsAmalfi" },
] as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
  throw new Error("guide manifest entry missing for beachHoppingAmalfi");
}

const { Component, clientLoader } = defineGuideRoute(manifestEntry, {
  template: () => ({
    relatedGuides: { items: RELATED_GUIDES.map((item) => ({ key: item.key })) },
  }),
});

const OG_IMAGE_PATH = DEFAULT_OG_IMAGE.path;

export default Component;
export { clientLoader };
export const meta: MetaFunction = ({ data }) => {
  const payload = (data ?? {}) as { lang?: AppLanguage };
  const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
  const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
  const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
  const image = buildCfImageUrl(OG_IMAGE_PATH, {
    width: DEFAULT_OG_IMAGE.width,
    height: DEFAULT_OG_IMAGE.height,
  });
  return buildRouteMeta({
    lang,
    title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
    description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
    isPublished: manifestEntry.status === "live",
  });
};
export const links: LinksFunction = () => buildRouteLinks();
