// src/routes/guides/driving-the-amalfi-coast-tips.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { guideAbsoluteUrl, guideHref, type GuideKey } from "@/routes.guides-helpers";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { toAppLanguage } from "@/utils/lang";
import type { LinksFunction, MetaFunction } from "react-router";
import { DEFAULT_OG_IMAGE } from "./guide-seo/constants";
import getFallbackLanguage from "./utils/getFallbackLanguage";

type GuideLinksArgs = Parameters<LinksFunction>[0];
type GuideMetaArgs = Parameters<MetaFunction>[0];

type GuideLinksContext = {
  data?: { lang?: unknown } | null;
  params?: { lang?: unknown } | null;
  request?: { url?: unknown } | null;
};

export const handle = { tags: ["transport", "car", "amalfi", "positano", "couples", "families"] };

export const GUIDE_KEY: GuideKey = "drivingAmalfi";
export const GUIDE_SLUG = "driving-the-amalfi-coast-tips" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for drivingAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
}

const buildGuideMeta = (entryArgs: GuideMetaArgs): ReturnType<MetaFunction> => {
  const data = (entryArgs?.data ?? {}) as { lang?: unknown };
  const rawLang = typeof data.lang === "string" ? data.lang : undefined;
  const lang = toAppLanguage(rawLang ?? getFallbackLanguage());
  const path = guideHref(lang, GUIDE_KEY);
  const url = guideAbsoluteUrl(lang, GUIDE_KEY);
  const imageSrc = buildCfImageUrl(DEFAULT_OG_IMAGE.path, {
    width: DEFAULT_OG_IMAGE.width,
    height: DEFAULT_OG_IMAGE.height,
  });
  return buildRouteMeta({
    lang,
    title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
    description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
    url,
    path,
    image: { src: imageSrc, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
    isPublished: manifestEntry.status === "live",
  });
};

const buildGuideLinks = (args?: GuideLinksArgs): ReturnType<LinksFunction> => {
  const safeArgs = (args ?? {}) as GuideLinksContext;
  const dataLang = typeof safeArgs?.data?.lang === "string" ? safeArgs.data.lang : undefined;
  const paramLang = typeof safeArgs?.params?.["lang"] === "string" ? safeArgs.params["lang"] : undefined;
  const lang = toAppLanguage(dataLang ?? paramLang ?? getFallbackLanguage());
  const path = guideHref(lang, GUIDE_KEY);
  const url = guideAbsoluteUrl(lang, GUIDE_KEY);
  const requestUrl = typeof safeArgs?.request?.url === "string" ? safeArgs.request.url : undefined;
  const origin = (() => {
    if (!requestUrl) return undefined;
    try {
      return new URL(requestUrl).origin;
    } catch {
      return undefined;
    }
  })();
  return buildRouteLinks({ lang, path, url, ...(origin ? { origin } : {}) });
};

const { Component, clientLoader } = defineGuideRoute(manifestEntry, {
  meta: (metaArgs) => buildGuideMeta(metaArgs),
  links: (linkArgs) => buildGuideLinks(linkArgs),
});

export default Component;
export { clientLoader };
export const meta: MetaFunction = (args) => buildGuideMeta(args);
export const links: LinksFunction = (
  ...linkArgs: Parameters<LinksFunction>
) => {
  const [firstArg] = linkArgs;
  return buildGuideLinks(firstArg);
};
