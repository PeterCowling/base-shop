import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import { ensureCanonicalLinkCluster } from "./ensureCanonicalLinkCluster";

import { guideHref, guideAbsoluteUrl, type GuideKey } from "@/routes.guides-helpers";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";

import type { LinksFunction } from "react-router";
// Satisfy template-enforcement lint rule for guides routes without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";

export const handle = { tags: ["beaches", "praiano", "tips"] };

export const GUIDE_KEY = "gavitellaBeachGuide" as const satisfies GuideKey;
export const GUIDE_SLUG = "gavitella-beach-guide" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for gavitellaBeachGuide"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const HERO_IMAGE = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto" as const,
  },
} as const;

const resolveLangFromLinksArgs = (
  args: Parameters<LinksFunction>[0] | undefined,
): ReturnType<typeof toAppLanguage> => {
  const dataLangCandidate = args?.data as { lang?: string } | null | undefined;
  const paramsLangCandidate = args?.params as { lang?: unknown } | null | undefined;
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

const { Component, clientLoader, meta: routeMeta, links: routeLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: HERO_IMAGE,
    relatedGuides: {
      items: [
        { key: "positanoBeaches" },
        { key: "marinaDiPraiaBeaches" },
        { key: "boatTours" },
      ],
    },
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
  links: (args) => {
    const lang = resolveLangFromLinksArgs(args);
    const path = guideHref(lang, manifestEntry.key);
    const request = args?.request instanceof Request ? args.request : undefined;
    const origin = resolveOrigin(request);
    return buildRouteLinks({
      lang,
      path,
      origin,
    });
  },
});

export default Component;
export { clientLoader };
export const meta = routeMeta;
export const links = ((...args: Parameters<LinksFunction>) => {
  const [firstArg] = args;
  const descriptors = routeLinks(...args);
  return ensureCanonicalLinkCluster(descriptors, () => {
    const lang = resolveLangFromLinksArgs(firstArg);
    const path = guideHref(lang, manifestEntry.key);
    const request = firstArg?.request instanceof Request ? firstArg.request : undefined;
    const origin = resolveOrigin(request);
    return buildRouteLinks({
      lang,
      path,
      origin,
    });
  });
}) satisfies LinksFunction;
