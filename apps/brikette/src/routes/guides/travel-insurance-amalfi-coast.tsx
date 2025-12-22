import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import type { LinksFunction } from "react-router";
import { buildRouteLinks } from "@/utils/routeHead";

export type _GuideSeoTemplateContext = GuideSeoTemplateContext;

export const handle = { tags: ["insurance", "amalfi", "positano"] };

export const GUIDE_KEY = "travelInsuranceAmalfi" as const satisfies GuideKey;
export const GUIDE_SLUG = "travel-insurance-amalfi-coast" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for travelInsuranceAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31]
}

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericWhenEmpty: true,
    suppressUnlocalizedFallback: true,
    relatedGuides: {
      items: [
        { key: "pathOfTheGods" },
        { key: "positanoTravelGuide" },
      ],
    },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(manifestEntry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();
