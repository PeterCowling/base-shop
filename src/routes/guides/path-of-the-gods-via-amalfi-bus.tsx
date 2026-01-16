// src/routes/guides/path-of-the-gods-via-amalfi-bus.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import type { GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

import { createPathOfTheGodsHowToSteps } from "./path-of-the-gods.how-to";
import { getPathOfTheGodsVariant } from "./path-of-the-gods.variants";
import { OG_IMAGE } from "./path-of-the-gods.constants";

import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideHref, guideAbsoluteUrl, type GuideKey } from "@/routes.guides-helpers";
import { toAppLanguage } from "@/utils/lang";
import { BASE_URL } from "@/config/site";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { OG_IMAGE as OG_DIMENSIONS } from "@/utils/headConstants";

export const handle = { tags: ["hiking", "amalfi", "bus", "positano"] } as const;

export const GUIDE_KEY = "pathOfTheGodsBus" as const satisfies GuideKey;
export const GUIDE_SLUG = "path-of-the-gods-via-amalfi-bus" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for pathOfTheGodsBus");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => {
    const { totalTime } = getPathOfTheGodsVariant("bus");
    return {
      ogImage: OG_IMAGE,
      includeHowToStructuredData: true,
      relatedGuides: {
        items: [
          { key: "pathOfTheGods" },
          { key: "pathOfTheGodsFerry" },
          { key: "pathOfTheGodsNocelle" },
        ],
      },
      buildHowToSteps: (context) =>
        createPathOfTheGodsHowToSteps(context, {
          guideKey: GUIDE_KEY,
          totalTime,
        }),
    };
  },
  meta: ({ data }, entry) => {
    const lang = toAppLanguage((data as { lang?: string } | undefined)?.lang);
    const path = guideHref(lang, entry.key);
    const url = guideAbsoluteUrl(lang, entry.key);
    const imageSrc = buildCfImageUrl(OG_IMAGE.path, {
      width: OG_DIMENSIONS.width,
      height: OG_DIMENSIONS.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      image: { src: imageSrc, width: OG_DIMENSIONS.width, height: OG_DIMENSIONS.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  links: (args: GuideLinksArgs | undefined, entry) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: string } | undefined;
    const lang = toAppLanguage(payload?.lang);
    const path = guideHref(lang, entry.key);
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };