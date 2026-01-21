// src/routes/guides/path-of-the-gods-via-nocelle.tsx
import type { MetaFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, type GuideAreaSlugKey,guideAreaToSlugKey } from "./guide-manifest";
import { OG_IMAGE } from "./path-of-the-gods.constants";
import { createPathOfTheGodsHowToSteps } from "./path-of-the-gods.how-to";
import { getPathOfTheGodsVariant } from "./path-of-the-gods.variants";

export const GUIDE_KEY = "pathOfTheGodsNocelle" satisfies GuideKey;
export const GUIDE_SLUG = "path-of-the-gods-via-nocelle" as const;

export const handle = { tags: ["hiking", "nocelle", "positano"] } as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry)
  throw new Error("guide manifest entry missing for pathOfTheGodsNocelle"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard

function buildMeta(metaKey: string, areaSlugKey: GuideAreaSlugKey, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? ("en" as AppLanguage);
    const areaSlug = getSlug(areaSlugKey, lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, GUIDE_KEY)}`;
    const url = `${BASE_URL}${path}`;
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

const buildHowToSteps = (context: GuideSeoTemplateContext) => {
  const { totalTime } = getPathOfTheGodsVariant("nocelle");
  return createPathOfTheGodsHowToSteps(context, {
    guideKey: GUIDE_KEY,
    totalTime,
  });
};

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    includeHowToStructuredData: true,
    buildHowToSteps,
    showPlanChoice: false,
    showTransportNotice: false,
    relatedGuides: {
      items: [
        { key: "pathOfTheGods" },
        { key: "pathOfTheGodsFerry" },
        { key: "pathOfTheGodsBus" },
      ],
    },
  }),
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    guideAreaToSlugKey(manifestEntry.primaryArea),
    manifestEntry.status === "live",
  ),
  links: (_args, _entry, base) => {
    const shared = buildRouteLinks();
    return shared.length > 0 ? shared : base;
  },
});

export default Component;
export { clientLoader, links,meta };
