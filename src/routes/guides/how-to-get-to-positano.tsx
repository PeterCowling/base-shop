// src/routes/guides/how-to-get-to-positano.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { LinksFunction } from "react-router";

import { renderArticleLead } from "./how-to-get-to-positano.article-lead";
import { renderAdditionalScripts } from "./how-to-get-to-positano.additional-scripts";
import { buildBreadcrumb } from "./how-to-get-to-positano.breadcrumb";
import { OG_IMAGE } from "./how-to-get-to-positano.constants";
import { buildGuideExtras } from "./how-to-get-to-positano.extras";
import { buildGuideFaqFallback } from "./how-to-get-to-positano.faq";
export { handle } from "./how-to-get-to-positano.metadata";

import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";
import { guideAbsoluteUrl, guideHref, type GuideKey } from "@/routes.guides-helpers";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";

export const GUIDE_KEY = "howToGetToPositano" satisfies GuideKey;
export const GUIDE_SLUG = "how-to-get-to-positano" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for howToGetToPositano");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleLead: (context) => renderArticleLead(context, buildGuideExtras),
    buildBreadcrumb: (context) => buildBreadcrumb(context),
    guideFaqFallback: (lang) => buildGuideFaqFallback(lang),
    additionalScripts: (context) => renderAdditionalScripts(context),
    renderGenericContent: false,
    relatedGuides: { items: RELATED_GUIDES.map(({ key }) => ({ key })) },
    alsoHelpful: {
      tags: [...ALSO_HELPFUL_TAGS],
      excludeGuide: RELATED_GUIDES.map(({ key }) => key),
      includeRooms: true,
    },
  }),
  structuredArticle: {
    guideKey: GUIDE_KEY,
    getExtras: (context) => buildGuideExtras(context),
    renderStructured: (_extras, context) => renderArticleLead(context, buildGuideExtras),
    renderFallback: (_context, contextExtras) => renderArticleLead(contextExtras, buildGuideExtras),
    selectTocItems: () => [],
    isStructured: (_extras, context) => context.hasLocalizedContent,
  },
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
  links: (args) => buildGuideLinks(args),
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (args?: Parameters<LinksFunction>[0]) => buildGuideLinks(args);

export { buildGuideExtras } from "./how-to-get-to-positano.extras";
export { renderAdditionalScripts } from "./how-to-get-to-positano.additional-scripts";
export { renderArticleLead } from "./how-to-get-to-positano.article-lead";
export {
  safeString,
  normaliseSections,
  normaliseWhenItems,
  normaliseFaqs,
} from "./how-to-get-to-positano.normalizers";