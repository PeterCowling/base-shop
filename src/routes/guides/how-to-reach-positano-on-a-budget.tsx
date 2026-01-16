// src/routes/guides/how-to-reach-positano-on-a-budget.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { LinksFunction } from "react-router";

import { renderArticleLead } from "./how-to-reach-positano-on-a-budget.articleLead";
import {
  buildBreadcrumb,
  buildHowToSteps,
  buildTocItems,
  guideFaqFallback,
} from "./how-to-reach-positano-on-a-budget.schema";
import {
  ALSO_HELPFUL_TAGS,
  GUIDE_KEY as CONST_GUIDE_KEY,
  GUIDE_SLUG as CONST_GUIDE_SLUG,
  OG_IMAGE,
  RELATED_GUIDES,
} from "./how-to-reach-positano-on-a-budget.constants";
export { handle } from "./how-to-reach-positano-on-a-budget.constants";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";
import { guideAbsoluteUrl, guideHref } from "@/routes.guides-helpers";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";

export const GUIDE_KEY = CONST_GUIDE_KEY;
export const GUIDE_SLUG = CONST_GUIDE_SLUG;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for reachBudget");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleLead: renderArticleLead,
    buildTocItems,
    buildHowToSteps,
    guideFaqFallback,
    buildBreadcrumb,
    renderGenericContent: false,
    relatedGuides: { items: manifestEntry.relatedGuides.map((key) => ({ key })) },
    alsoHelpful: {
      tags: Array.from(ALSO_HELPFUL_TAGS),
      excludeGuide: Array.from(RELATED_GUIDES, (item) => item.key),
      includeRooms: true,
    },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = guideHref(lang, manifestEntry.key);
    const url = guideAbsoluteUrl(lang, manifestEntry.key);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: {
        src: buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform),
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
      },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: (args) => buildGuideLinks(args),
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (args) => buildGuideLinks(args);