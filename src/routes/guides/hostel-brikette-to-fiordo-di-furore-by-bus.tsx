// src/routes/guides/hostel-brikette-to-fiordo-di-furore-by-bus.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey, type GuideAreaSlugKey } from "./guide-manifest";

import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref, guideAbsoluteUrl } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteMeta } from "@/utils/routeHead";
import type { AppLanguage } from "@/i18n.config";
import type { MetaFunction } from "react-router";

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

function buildMeta(areaSlugKey: GuideAreaSlugKey, metaKey: string, isPublished: boolean): MetaFunction {
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
if (!manifestEntry) throw new Error("guide manifest entry missing for hostelBriketteToFiordoDiFuroreBus");

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
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
  meta: buildMeta(
    guideAreaToSlugKey(manifestEntry.primaryArea),
    manifestEntry.metaKey ?? manifestEntry.key,
    manifestEntry.status === "live",
  ),
});

export default Component;
export { clientLoader, meta, links };