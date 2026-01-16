// src/routes/guides/path-of-the-gods-via-nocelle.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import type { GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey, type GuideAreaSlugKey } from "./guide-manifest";

import { getPathOfTheGodsVariant } from "./path-of-the-gods.variants";
import { OG_IMAGE } from "./path-of-the-gods.constants";
import { createPathOfTheGodsHowToSteps } from "./path-of-the-gods.how-to";

import type { GuideSeoTemplateContext } from "./guide-seo/types";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";
import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";
import type { MetaFunction } from "react-router";

export const GUIDE_KEY = "pathOfTheGodsNocelle" satisfies GuideKey;
export const GUIDE_SLUG = "path-of-the-gods-via-nocelle" as const;

export const handle = { tags: ["hiking", "nocelle", "positano"] } as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) throw new Error("guide manifest entry missing for pathOfTheGodsNocelle");

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
  links: (args: GuideLinksArgs | undefined, entry) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: string } | undefined;
    const lang = toAppLanguage(payload?.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };