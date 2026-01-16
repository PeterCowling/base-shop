// src/routes/guides/path-of-the-gods-from-brikette.tsx
import {
  defineGuideRoute,
  createStructuredLeadWithBuilder,
  type GuideLinksArgs,
} from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

import {
  createPathOfTheGodsArticleExtras,
  createPathOfTheGodsArticleLead,
} from "./_path-of-the-gods.article";
import { createPathOfTheGodsExtras } from "./path-of-the-gods.extras";
import { createPathOfTheGodsHowToSteps } from "./path-of-the-gods.how-to";
import { buildPathOfTheGodsGallerySources } from "./path-of-the-gods.gallery";
import {
  PATH_OF_THE_GODS_HANDLE,
  GUIDE_KEY,
  GUIDE_SLUG,
  OG_IMAGE,
} from "./path-of-the-gods.constants";

import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideHref, guideAbsoluteUrl } from "@/routes.guides-helpers";
import { toAppLanguage, langFromRequest } from "@/utils/lang";
import { buildRouteMeta } from "@/utils/routeHead";
import { OG_IMAGE as OG_DIMENSIONS } from "@/utils/headConstants";
import type { MetaFunction } from "react-router";

export const handle = PATH_OF_THE_GODS_HANDLE;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for pathOfTheGods");
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
const PathOfTheGodsArticleLead = createPathOfTheGodsArticleLead(buildGuideExtras);
const PathOfTheGodsArticleExtras = createPathOfTheGodsArticleExtras((context) => {
  const { galleryItems, galleryTitle } = buildGuideExtras(context);
  return { galleryItems, galleryTitle };
});

const pathOfTheGodsStructuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: (context) => buildGuideExtras(context),
  render: (context) => PathOfTheGodsArticleLead(context),
  selectTocItems: (extras) => extras.tocItems,
  isStructured: (extras) =>
    extras.intro.length > 0 ||
    extras.sections.length > 0 ||
    extras.tips.length > 0 ||
    extras.essentials.length > 0 ||
    extras.costs.length > 0,
});

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
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
    articleLead: pathOfTheGodsStructuredLead.articleLead,
    articleExtras: PathOfTheGodsArticleExtras,
    buildTocItems: (context) => {
      const extras = pathOfTheGodsStructuredLead.structuredArticle.getExtras(context);
      return pathOfTheGodsStructuredLead.structuredArticle.selectTocItems(extras, context);
    },
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
  links: (args: GuideLinksArgs | undefined, entry) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: string } | undefined;
    const lang = toAppLanguage(payload?.lang);
    const path = guideHref(lang, entry.key);
    return buildRouteLinks({ lang, path });
  },
  clientLoader: async ({ request }) => {
    try {
      // i18n-exempt -- TECH-000 [ttl=2026-12-31] Debug utilities import path
      const { debugGuide, isGuideDebugEnabled } = await import("@/utils/debug");
      if (isGuideDebugEnabled()) {
        debugGuide(
          // i18n-exempt -- TECH-000 [ttl=2026-12-31] Debug logging label
          "Route clientLoader",
          {
            route: GUIDE_KEY,
            lang: langFromRequest(request),
            url: request.url,
          },
        );
      }
    } catch {
      // ignore debug failures
    }
    return null;
  },
});

export default Component;
export { clientLoader, meta, links };

export { createPathOfTheGodsExtras } from "./path-of-the-gods.extras";
export { createPathOfTheGodsHowToSteps } from "./path-of-the-gods.how-to";