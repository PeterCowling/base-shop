// src/routes/guides/hostel-brikette-to-fornillo-beach.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref, guideAbsoluteUrl } from "@/routes.guides-helpers";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import type { AppLanguage } from "@/i18n.config";
import type { LinksFunction, MetaFunction } from "react-router";

export const handle = { tags: ["beaches", "stairs", "positano"] };

export const GUIDE_KEY = "hostelBriketteToFornilloBeach" satisfies GuideKey;
export const GUIDE_SLUG = "hostel-brikette-to-fornillo-beach" as const;

const OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto" as const,
  },
} as const;

function buildMeta(metaKey: string, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? ("en" as AppLanguage);
    const path = guideHref(lang, GUIDE_KEY);
    const url = guideAbsoluteUrl(lang, GUIDE_KEY);
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
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

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for hostelBriketteToFornilloBeach"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const { Component, clientLoader, links: baseLinks, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    relatedGuides: {
      items: [
        { key: "positanoBeaches" },
        { key: "beachHoppingAmalfi" },
        { key: "positanoTravelGuide" },
      ],
    },
    alsoHelpful: {
      tags: ["beaches", "positano", "stairs"],
      excludeGuide: ["positanoBeaches", "beachHoppingAmalfi", "positanoTravelGuide"],
      includeRooms: true,
    },
  }),
  meta: buildMeta(manifestEntry.metaKey ?? manifestEntry.key, manifestEntry.status === "live"),
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (...args: Parameters<LinksFunction>) => {
  const descriptors = baseLinks(...args);
  return Array.isArray(descriptors) && descriptors.length > 0 ? descriptors : buildRouteLinks();
};
