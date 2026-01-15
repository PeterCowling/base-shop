// src/routes/guides/positano-travel-guide.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder, type GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideAbsoluteUrl, guideHref } from "@/routes.guides-helpers";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";
import { BASE_URL } from "@/config/site";
import GenericContent from "@/components/guides/GenericContent";
import type { AppLanguage } from "@/i18n.config";

import { createGuideFaqFallback } from "./positano-travel-guide/guideFaqFallback";
import { FallbackContent } from "./positano-travel-guide/FallbackContent";
import { createFallbackData } from "./positano-travel-guide/fallbackData";
import type { FallbackData } from "./positano-travel-guide/types";
import {
  GUIDE_KEY as GUIDE_KEY_CONST,
  GUIDE_SLUG as GUIDE_SLUG_CONST,
  OG_IMAGE,
  handle,
} from "./positano-travel-guide/constants";

export { handle };

export const GUIDE_KEY = GUIDE_KEY_CONST;
export const GUIDE_SLUG = GUIDE_SLUG_CONST;

const guideHarnessHost = globalThis as typeof globalThis & {
  __GUIDE_GENERIC_CONTENT__?: typeof GenericContent;
};

function resolveGenericContentComponent(): typeof GenericContent {
  const injected = guideHarnessHost.__GUIDE_GENERIC_CONTENT__;
  if (typeof injected === "function") {
    return injected as typeof GenericContent;
  }
  return GenericContent;
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for positanoTravelGuide");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => {
    const getExtras = structuredLead.structuredArticle.getExtras;
    const selectTocItems = structuredLead.structuredArticle.selectTocItems;
    return {
      ogImage: OG_IMAGE,
      renderGenericContent: false,
      articleLead: structuredLead.articleLead,
      buildExtras: (context) => getExtras(context),
      buildTocItems: (context) => selectTocItems(getExtras(context), context),
      guideFaqFallback: createGuideFaqFallback,
    };
  },
  structuredArticle: structuredLead.structuredArticle,
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = guideHref(lang, manifestEntry.key);
    const url = guideAbsoluteUrl(lang, manifestEntry.key);
    const image = buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform);
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
  links: (args?: GuideLinksArgs) => {
    const payload = ((args ?? {}) as { data?: { lang?: string } }).data;
    const lang = toAppLanguage(payload?.lang);
    const path = guideHref(lang, manifestEntry.key);
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };