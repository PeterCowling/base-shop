// src/routes/guides/laundry-positano.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

import { buildGuideExtras } from "./laundry-positano/buildGuideExtras";
import { createArticleLead } from "./laundry-positano/_createArticleLead";
import { createGuideFaqFallback } from "./laundry-positano/createGuideFaqFallback";
import { createHowToSteps } from "./laundry-positano/createHowToSteps";
import { createTocBuilder } from "./laundry-positano/createTocBuilder";
import {
  ALSO_HELPFUL_TAGS,
  GUIDE_KEY,
  GUIDE_SLUG,
  OG_IMAGE,
  RELATED_GUIDES,
} from "./laundry-positano/constants";

import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { toAppLanguage } from "@/utils/lang";
import { getSlug } from "@/utils/slug";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import type { LinksFunction, MetaFunction } from "react-router";

export const GUIDE_KEY: GuideKey = ROUTE_GUIDE_KEY;
export const GUIDE_SLUG = ROUTE_GUIDE_SLUG;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for laundryPositano");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    renderGenericContent: false,
    relatedGuides: { items: RELATED_GUIDES },
    alsoHelpful: {
      tags: [...ALSO_HELPFUL_TAGS],
      excludeGuide: RELATED_GUIDES.map((item) => item.key),
      includeRooms: true,
    },
    articleLead: (context) => createArticleLead(buildGuideExtras, context),
    buildTocItems: (context) => createTocBuilder(buildGuideExtras, context),
    buildHowToSteps: (context) => createHowToSteps(buildGuideExtras, context),
    guideFaqFallback: (lang) => createGuideFaqFallback(lang),
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
export { clientLoader, meta, links };