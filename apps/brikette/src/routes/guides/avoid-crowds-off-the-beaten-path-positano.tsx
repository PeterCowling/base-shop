// src/routes/guides/avoid-crowds-off-the-beaten-path-positano.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export const handle = { tags: ["travel-tips", "positano", "hidden-gems", "shoulder", "viewpoints"] };

export const GUIDE_KEY = "avoidCrowdsPositano" as const satisfies GuideKey;
export const GUIDE_SLUG = "avoid-crowds-off-the-beaten-path-positano" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for avoidCrowdsPositano"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
}

const { Component, clientLoader } = defineGuideRoute(manifestEntry);

const OG_IMAGE_PATH = DEFAULT_OG_IMAGE.path;

export default Component;
export { clientLoader };
export const meta: MetaFunction = ({ data }) => {
  const payload = (data ?? {}) as { lang?: AppLanguage };
  const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
  const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
  const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
  const image = buildCfImageUrl(OG_IMAGE_PATH, {
    width: DEFAULT_OG_IMAGE.width,
    height: DEFAULT_OG_IMAGE.height,
  });
  return buildRouteMeta({
    lang,
    title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
    description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
    isPublished: manifestEntry.status === "live",
  });
};
export const links: LinksFunction = () => buildRouteLinks();
