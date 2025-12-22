// src/routes/guides/staying-fit-while-traveling-amalfi-coast.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import { DEFAULT_OG_IMAGE } from "./guide-seo/constants";
import "@/routes/guides/_GuideSeoTemplate";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import type { MetaFunction, LinksFunction } from "react-router";

export const handle = { tags: ["wellness", "hiking", "positano"] };

export const GUIDE_KEY = "stayingFitAmalfi" as const satisfies GuideKey;
export const GUIDE_SLUG = "staying-fit-while-traveling-amalfi-coast" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry)
  throw new Error("guide manifest entry missing for stayingFitAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard

const { Component, clientLoader } = defineGuideRoute(manifestEntry);

const OG_IMAGE_SRC = buildCfImageUrl(DEFAULT_OG_IMAGE.path, {
  width: DEFAULT_OG_IMAGE.width,
  height: DEFAULT_OG_IMAGE.height,
});

export const meta: MetaFunction = ({ data }) => {
  const lang = ((data as { lang?: AppLanguage } | undefined)?.lang ??
    (i18nConfig.fallbackLng as AppLanguage)) as AppLanguage;
  const areaSlug = getSlug(guideAreaToSlugKey(manifestEntry.primaryArea), lang);
  const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
  const url = `${BASE_URL}${path}`;

  return buildRouteMeta({
    lang,
    title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
    description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
    url,
    path,
    image: {
      src: OG_IMAGE_SRC,
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
    },
    ogType: manifestEntry.options?.ogType ?? "article",
    includeTwitterUrl: true,
    isPublished: manifestEntry.status === "live",
  });
};

export const links: LinksFunction = () => buildRouteLinks();

export default Component;
export { clientLoader };
