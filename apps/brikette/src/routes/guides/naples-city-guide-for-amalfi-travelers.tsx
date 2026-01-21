// src/routes/guides/naples-city-guide-for-amalfi-travelers.tsx
import type { LinksFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideAbsoluteUrl, guideHref, type GuideKey } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

export const handle = { tags: ["naples", "day-trip", "food", "culture"] };

export const GUIDE_KEY = "naplesCityGuide" as const satisfies GuideKey;
export const GUIDE_SLUG = "naples-city-guide-for-amalfi-travelers" as const;

const HERO_IMAGE = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: OG_IMAGE.width,
  height: OG_IMAGE.height,
  transform: {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  },
} as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error(`guide manifest entry missing for ${GUIDE_KEY}`); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const resolveLangFromLinksArgs = (
  args: Parameters<LinksFunction>[0] | undefined,
): ReturnType<typeof toAppLanguage> => {
  const dataLangCandidate = args?.data as { lang?: string } | null | undefined;
  const paramsLangCandidate = args?.params as { lang?: unknown } | undefined;
  const dataLang = typeof dataLangCandidate?.lang === "string" ? dataLangCandidate.lang : undefined;
  const paramLang = typeof paramsLangCandidate?.lang === "string" ? paramsLangCandidate.lang : undefined;
  return toAppLanguage(dataLang ?? paramLang ?? undefined);
};

const resolveOrigin = (request: Request | undefined): string => {
  if (!request) return BASE_URL;
  try {
    return new URL(request.url).origin;
  } catch {
    return BASE_URL;
  }
};

const { Component, clientLoader: routeClientLoader, meta: routeMeta, links: routeLinks } =
  defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: HERO_IMAGE,
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = guideHref(lang, manifestEntry.key);
    const url = guideAbsoluteUrl(lang, manifestEntry.key);
    const image = buildCfImageUrl(HERO_IMAGE.path, HERO_IMAGE.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: image, width: HERO_IMAGE.width, height: HERO_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: (args, entry) => {
    const lang = resolveLangFromLinksArgs(args);
    const path = guideHref(lang, entry.key);
    const request =
      args && typeof args === "object" && "request" in args
        ? (args as { request?: Request }).request
        : undefined;
    const origin = resolveOrigin(request instanceof Request ? request : undefined);
    return buildRouteLinks({
      lang,
      path,
      origin,
    });
  },
});

export default Component;
export const clientLoader = routeClientLoader;
export const meta = routeMeta;
export const links: LinksFunction = routeLinks;
