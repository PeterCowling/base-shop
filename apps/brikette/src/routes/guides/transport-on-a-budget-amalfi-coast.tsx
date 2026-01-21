// src/routes/guides/transport-on-a-budget-amalfi-coast.tsx
import type { LinksFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export type _GuideSeoTemplateContext = GuideSeoTemplateContext;

export const handle = { tags: ["transport", "budgeting", "passes"] };

export const GUIDE_KEY: GuideKey = "transportBudget";
export const GUIDE_SLUG = "transport-on-a-budget-amalfi-coast" as const;

const OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for transportBudget"); // i18n-exempt -- TECH-000 [ttl=2026-12-31]
}

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    relatedGuides: { items: manifestEntry.relatedGuides.map((key) => ({ key })) },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    const image = buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();
