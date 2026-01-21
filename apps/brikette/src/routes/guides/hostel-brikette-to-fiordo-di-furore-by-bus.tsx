// src/routes/guides/hostel-brikette-to-fiordo-di-furore-by-bus.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import type { AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideAbsoluteUrl,guideHref } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

export const handle = { tags: ["beaches", "bus", "stairs", "positano"] };

export const GUIDE_KEY = "hostelBriketteToFiordoDiFuroreBus" as const satisfies GuideKey;
export const GUIDE_SLUG = "hostel-brikette-to-fiordo-di-furore-by-bus" as const;

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

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for hostelBriketteToFiordoDiFuroreBus"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const { Component, clientLoader, links: baseLinks, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    relatedGuides: {
      items: [
        { key: "fiordoDiFuroreBeachGuide" },
        { key: "fiordoDiFuroreBusReturn" },
        { key: "positanoBeaches" },
      ],
    },
    alsoHelpful: {
      tags: ["beaches", "bus", "positano"],
      excludeGuide: ["fiordoDiFuroreBeachGuide", "fiordoDiFuroreBusReturn", "positanoBeaches"],
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
