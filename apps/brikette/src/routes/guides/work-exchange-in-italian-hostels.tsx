// src/routes/guides/work-exchange-in-italian-hostels.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import { ensureCanonicalLinkCluster } from "./ensureCanonicalLinkCluster";

// Enforce shared guide template usage for linting without runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { guideHref, guideAbsoluteUrl, type GuideKey } from "@/routes.guides-helpers";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { BASE_URL } from "@/config/site";
import type { LinksFunction } from "react-router";

export const handle = { tags: ["work-exchange", "hostel-life", "italy"] };

export const GUIDE_KEY = "workExchangeItaly" as const satisfies GuideKey;
export const GUIDE_SLUG = "work-exchange-in-italian-hostels" as const;

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
  throw new Error(
    `guide manifest entry missing for ${GUIDE_KEY}`,
  ); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
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
    meta: ({ data }, entry) => {
      const payload = (data ?? {}) as { lang?: string };
      const lang = toAppLanguage(payload.lang);
      const path = guideHref(lang, entry.key);
      const url = guideAbsoluteUrl(lang, entry.key);
      const image = buildCfImageUrl(HERO_IMAGE.path, HERO_IMAGE.transform);
      return buildRouteMeta({
        lang,
        title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
        description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
        url,
        path,
        image: { src: image, width: HERO_IMAGE.width, height: HERO_IMAGE.height },
        ogType: "article",
        includeTwitterUrl: true,
        isPublished: entry.status === "live",
      });
    },
    links: (args, entry) => {
      const lang = resolveLangFromLinksArgs(args);
      const path = guideHref(lang, entry.key);
      const origin = resolveOrigin(args && "request" in args ? args.request : undefined);
      return buildRouteLinks({
        lang,
        origin,
        path,
      });
    },
  });

export default Component;
export const clientLoader = routeClientLoader;
export const meta = routeMeta;
export const links: LinksFunction = (...args: Parameters<LinksFunction>) => {
  const [firstArg] = args;
  const descriptors = routeLinks(...args);
  return ensureCanonicalLinkCluster(descriptors, () => {
    const lang = resolveLangFromLinksArgs(firstArg);
    const path = guideHref(lang, manifestEntry.key);
    const request =
      firstArg && typeof firstArg === "object" && "request" in firstArg
        ? (firstArg as { request?: Request }).request
        : undefined;
    const origin = resolveOrigin(request instanceof Request ? request : undefined);
    return buildRouteLinks({
      lang,
      origin,
      path,
    });
  });
};
