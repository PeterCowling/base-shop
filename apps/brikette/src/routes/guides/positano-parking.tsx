// src/routes/guides/positano-parking.tsx
import type { LinksFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export const handle = { tags: ["transport", "car", "positano", "parking"] };

export const GUIDE_KEY: GuideKey = "parking";
export const GUIDE_SLUG = "positano-parking" as const;

const OG_IMAGE = { path: "/img/positano-panorama.avif", width: 1200, height: 630 } as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for parking"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
}

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({ ogImage: OG_IMAGE }),
  meta: ({ data }, entry) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const image = buildCfImageUrl(OG_IMAGE.path, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
});

const links: LinksFunction = (...args: Parameters<LinksFunction>) => {
  const descriptors = baseLinks(...args);
  return descriptors.length > 0 ? descriptors : buildRouteLinks();
};

export default Component;
export { clientLoader, links,meta };
