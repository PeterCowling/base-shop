// src/routes/guides/porter-service-positano.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import type { GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import GenericContent from "@/components/guides/GenericContent";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideAbsoluteUrl, guideHref, type GuideKey } from "@/routes.guides-helpers";
import { toAppLanguage } from "@/utils/lang";
import { BASE_URL } from "@/config/site";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";

import { renderPorterServiceArticle } from "./porter-service-positano.article-lead";
import { createBuildHowToSteps } from "./porter-service-positano.how-to";
import { createGuideFaqFallback } from "./porter-service-positano.faq-fallback";
import { createAdditionalScripts } from "./porter-service-positano.service-data";
import {
  computePorterGuideExtras,
  createPorterHowToSteps,
} from "./porter-service-positano.extras";
import {
  GUIDE_KEY as CONST_GUIDE_KEY,
  GUIDE_SLUG as CONST_GUIDE_SLUG,
  OG_IMAGE,
} from "./porter-service-positano.constants";
import { getGuidesTranslator, getGuidesFallbackTranslator } from "./porter-service-positano.translators";
import { type GuideExtras } from "./porter-service-positano.types";

export const handle = { tags: ["logistics", "porters", "positano"] } as const;
export { computePorterGuideExtras, createPorterHowToSteps };
export { getGuidesFallbackTranslator, getGuidesTranslator } from "./porter-service-positano.translators";
export { normaliseFaqs, normaliseSections, normaliseToc } from "./porter-service-positano.normalisers";

export const GUIDE_KEY = CONST_GUIDE_KEY satisfies GuideKey;
export const GUIDE_SLUG = CONST_GUIDE_SLUG;

const fallbackGuidesTranslator = getGuidesTranslator("en");
const fallbackEnglishGuides = getGuidesFallbackTranslator("en");
const guideFaqFallback = createGuideFaqFallback();
const additionalScripts = createAdditionalScripts(fallbackGuidesTranslator);

const extrasCache = new WeakMap<GuideSeoTemplateContext, GuideExtras>();

function buildGuideExtras(context: GuideSeoTemplateContext): GuideExtras {
  const cached = extrasCache.get(context);
  if (cached) return cached;
  const extras = computePorterGuideExtras(context, {
    fallbackGuides: fallbackGuidesTranslator,
    fallbackLocal: getGuidesFallbackTranslator(context.lang),
    fallbackEn: fallbackEnglishGuides,
  });
  extrasCache.set(context, extras);
  return extras;
}

function hasStructuredContent(extras: GuideExtras): boolean {
  return (
    extras.intro.length > 0 ||
    extras.sections.length > 0 ||
    extras.steps.length > 0 ||
    extras.resources.length > 0 ||
    extras.faqs.length > 0
  );
}

const buildHowToSteps = createBuildHowToSteps(buildGuideExtras);

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for porterServices");
}

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: (context) => buildGuideExtras(context),
  render: (context, extras) => {
    if (!hasStructuredContent(extras)) {
      return <GenericContent guideKey={GUIDE_KEY} t={context.translateGuides} />;
    }
    return renderPorterServiceArticle(extras, context);
  },
  selectTocItems: (extras) => extras.tocItems,
  isStructured: (extras) => hasStructuredContent(extras),
});

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  structuredArticle: structuredLead.structuredArticle,
  template: () => ({
    ogImage: OG_IMAGE,
    articleLead: structuredLead.articleLead,
    buildHowToSteps: (context) => buildHowToSteps(context),
    guideFaqFallback: (lang) => guideFaqFallback(lang),
    additionalScripts: (context) => additionalScripts(context),
    renderGenericContent: false,
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = guideHref(lang, manifestEntry.key, { forceGuidesBase: true });
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
  links: (args: GuideLinksArgs | undefined, entry) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: string } | undefined;
    const lang = toAppLanguage(payload?.lang);
    const path = guideHref(lang, entry.key, { forceGuidesBase: true });
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };