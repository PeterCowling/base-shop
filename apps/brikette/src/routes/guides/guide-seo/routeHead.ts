// src/routes/guides/guide-seo/routeHead.ts
/*
 * Single-purpose: build route-level meta() and links() for guide pages.
 * Re-exported from src/routes/guides/_GuideSeoTemplate.tsx for backwards compatibility.
 */
import type { MetaFunction, LinksFunction } from "react-router";
import type { AppLanguage } from "@/i18n.config";

import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideSlug, type GuideKey } from "@/guides/slugs";
import { getSlug } from "@/utils/slug";
import { toAppLanguage } from "@/utils/lang";
import { OG_IMAGE } from "@/utils/headConstants";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";

export function makeGuideMeta(guideKey: GuideKey): MetaFunction {
  return (args: Parameters<MetaFunction>[0]) => {
    const d = (args?.data || {}) as { lang?: AppLanguage };
    const lang: AppLanguage = toAppLanguage(d.lang || "en");
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, guideKey)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    const title = `guides.meta.${guideKey}.title`;
    const description = `guides.meta.${guideKey}.description`;
    return buildRouteMeta({
      lang,
      title,
      description,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
    });
  };
}

export function makeGuideLinks(_guideKey: GuideKey): LinksFunction {
  return () => buildRouteLinks();
}

export type { GuideKey };
