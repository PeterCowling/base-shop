// src/routes/guides/scooter-rental-positano-guide.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
// Satisfy guide template enforcement lint rule.
import type {} from "@/routes/guides/_GuideSeoTemplate";

import type { GuideKey } from "@/routes.guides-helpers";
import type { LinksFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideSlug } from "@/routes.guides-helpers";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { toAppLanguage } from "@/utils/lang";
import { DEFAULT_OG_IMAGE } from "./guide-seo/constants";

export const handle = { tags: ["transport", "scooter", "positano", "sorrento", "safety"] };

export const GUIDE_KEY = "scooterRentalPositano" as const satisfies GuideKey;
export const GUIDE_SLUG = "scooter-rental-positano-guide" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for scooterRentalPositano"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
}

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  meta: ({ data }, entry) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const image = buildCfImageUrl(DEFAULT_OG_IMAGE.path, {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
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
export { clientLoader, meta, links };
