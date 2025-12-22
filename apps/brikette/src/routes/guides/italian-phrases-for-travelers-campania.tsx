import type {} from "@/routes/guides/_GuideSeoTemplate";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref, guideAbsoluteUrl } from "@/routes.guides-helpers";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import type { LinksFunction } from "react-router";

export const handle = { tags: ["language", "campania", "positano", "travel-tips"] };

export const GUIDE_KEY: GuideKey = "italianPhrasesCampania";
export const GUIDE_SLUG = "italian-phrases-for-travelers-campania" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for italianPhrasesCampania"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard
}

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    preferGenericWhenFallback: true,
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const url = guideAbsoluteUrl(lang, manifestEntry.key);
    const path = guideHref(lang, manifestEntry.key);
    const imageSrc = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: imageSrc, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (args) => {
  const descriptors = baseLinks(args);
  return Array.isArray(descriptors) && descriptors.length > 0 ? descriptors : buildRouteLinks();
};
