// src/routes/guides/7-day-amalfi-coast-itinerary-no-car.tsx
import type { LinksFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE } from "@/utils/headConstants";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export const handle = { tags: ["itinerary", "amalfi", "no-car"] };

export const GUIDE_KEY: GuideKey = "sevenDayNoCar";
export const GUIDE_SLUG = "7-day-amalfi-coast-itinerary-no-car" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error(
    "guide manifest entry missing for sevenDayNoCar", // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
  );
}

const OG_IMAGE_PATH = "/img/hostel-communal-terrace-lush-view.webp";

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    relatedGuides: {
      items: [{ key: "itinerariesPillar" }, { key: "positanoTravelGuide" }, { key: "dayTripsAmalfi" }],
    },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    const image = buildCfImageUrl(OG_IMAGE_PATH, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();
