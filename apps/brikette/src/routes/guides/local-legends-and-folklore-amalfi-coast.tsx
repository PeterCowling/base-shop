import type {} from "@/routes/guides/_GuideSeoTemplate";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref, guideAbsoluteUrl } from "@/routes.guides-helpers";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";
import { OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import type { LinksFunction } from "react-router";

export const handle = { tags: ["culture", "amalfi", "stories"] };

export const GUIDE_KEY = "folkloreAmalfi" as const satisfies GuideKey;
export const GUIDE_SLUG = "local-legends-and-folklore-amalfi-coast" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error(`guide manifest entry missing for ${GUIDE_KEY}`); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard
}

const resolveLangFromLinksArgs = (
  args: Parameters<LinksFunction>[0],
): ReturnType<typeof toAppLanguage> => {
  const dataLang = typeof (args?.data as { lang?: string } | null | undefined)?.lang === "string"
    ? (args?.data as { lang?: string }).lang
    : undefined;
  const paramLang = typeof args?.params?.["lang"] === "string" ? args.params["lang"] : undefined;
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
    preferManualWhenUnlocalized: true,
    relatedGuides: {
      items: [
        { key: "luminariaPraiano" },
        { key: "ravelloFestival" },
        { key: "ferragostoPositano" },
      ],
    },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = guideHref(lang, manifestEntry.key);
    const url = guideAbsoluteUrl(lang, manifestEntry.key);
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
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
