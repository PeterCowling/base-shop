// src/routes/guides/path-of-the-gods-from-brikette.tsx
import type { LinksFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideAbsoluteUrl,guideHref } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE as OG_DIMENSIONS } from "@/utils/headConstants";
import { langFromRequest,toAppLanguage } from "@/utils/lang";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";

import {
  createPathOfTheGodsArticleExtras,
  createPathOfTheGodsArticleLead,
} from "./_path-of-the-gods.article";
import { defineGuideRoute } from "./defineGuideRoute";
import { ensureCanonicalLinkCluster } from "./ensureCanonicalLinkCluster";
import { getGuideManifestEntry } from "./guide-manifest";
import {
  GUIDE_KEY as PATH_GUIDE_KEY,
  GUIDE_SLUG as PATH_GUIDE_SLUG,
  OG_IMAGE,
  PATH_OF_THE_GODS_HANDLE,
} from "./path-of-the-gods.constants";
import { createPathOfTheGodsExtras } from "./path-of-the-gods.extras";
import { buildPathOfTheGodsGallerySources } from "./path-of-the-gods.gallery";
import { createPathOfTheGodsHowToSteps } from "./path-of-the-gods.how-to";

export const handle = PATH_OF_THE_GODS_HANDLE;

export const GUIDE_KEY = PATH_GUIDE_KEY;
export const GUIDE_SLUG = PATH_GUIDE_SLUG;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error(
    `guide manifest entry missing for ${GUIDE_KEY}`,
  ); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard
}

let gallerySourcesCache: ReturnType<typeof buildPathOfTheGodsGallerySources> | undefined;
const getGallerySources = () => {
  if (!gallerySourcesCache) {
    gallerySourcesCache = buildPathOfTheGodsGallerySources();
  }
  return gallerySourcesCache;
};

const buildGuideExtras = (context: Parameters<typeof createPathOfTheGodsExtras>[0]) =>
  createPathOfTheGodsExtras(context, getGallerySources());

const resolveLangFromLinksArgs = (
  args: Parameters<LinksFunction>[0] | undefined,
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
    ogImage: OG_IMAGE,
    includeHowToStructuredData: true,
    renderGenericContent: false,
    relatedGuides: {
      items: [
        { key: "pathOfTheGodsFerry" },
        { key: "pathOfTheGodsBus" },
        { key: "pathOfTheGodsNocelle" },
      ],
    },
    articleLead: createPathOfTheGodsArticleLead(buildGuideExtras),
    articleExtras: createPathOfTheGodsArticleExtras((context) => {
      const { galleryItems, galleryTitle } = buildGuideExtras(context);
      return { galleryItems, galleryTitle };
    }),
    buildTocItems: (context) => buildGuideExtras(context).tocItems,
    buildHowToSteps: (context) => createPathOfTheGodsHowToSteps(context),
  }),
  meta: ({ data }, entry) => {
    const lang = toAppLanguage((data as { lang?: string } | undefined)?.lang);
    const path = guideHref(lang, entry.key);
    const url = guideAbsoluteUrl(lang, entry.key);
    const imageSrc = buildCfImageUrl(OG_IMAGE.path, {
      width: OG_DIMENSIONS.width,
      height: OG_DIMENSIONS.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      image: { src: imageSrc, width: OG_DIMENSIONS.width, height: OG_DIMENSIONS.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  clientLoader: async ({ request }) => {
    try {
      const { debugGuide, isGuideDebugEnabled } = await import("@/utils/debug"); // i18n-exempt -- OPS-123 [ttl=2025-12-31] Debug helper module identifier
      if (isGuideDebugEnabled()) {
        debugGuide({
          routeClientLoader: {
            route: GUIDE_KEY,
            lang: langFromRequest(request),
            url: request.url,
          },
        }); // i18n-exempt -- OPS-123 [ttl=2025-12-31] Observability-only debug payload
      }
    } catch {
      // ignore debug failures
    }
    return null;
  },
  links: (args, entry) => {
    const lang = resolveLangFromLinksArgs(args);
    const path = guideHref(lang, entry.key);
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
      path,
      origin,
    });
  });
};

export { createPathOfTheGodsExtras } from "./path-of-the-gods.extras";
export { createPathOfTheGodsHowToSteps } from "./path-of-the-gods.how-to";
