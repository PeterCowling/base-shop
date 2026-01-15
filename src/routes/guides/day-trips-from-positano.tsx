// src/routes/guides/day-trips-from-positano.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

import { BASE_URL } from "@/config/site";
import { guideAbsoluteUrl, guideHref, type GuideKey } from "@/routes.guides-helpers";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";
import type { LinksFunction, MetaFunction } from "react-router";


export const handle = { tags: ["itinerary", "day-trip", "amalfi"] };

export const GUIDE_KEY: GuideKey = "dayTripsAmalfi";
export const GUIDE_SLUG = "day-trips-from-positano" as const;

const RELATED_GUIDES = [{ key: "capriDayTrip" }, { key: "positanoPompeii" }, { key: "positanoAmalfi" }] as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for dayTripsAmalfi");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericWhenEmpty: true,
    relatedGuides: { items: RELATED_GUIDES.map((item) => ({ key: item.key })) },
  }),
});

export default Component;
export { clientLoader, meta, links };