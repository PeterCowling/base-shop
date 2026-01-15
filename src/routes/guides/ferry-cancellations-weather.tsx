// src/routes/guides/ferry-cancellations-weather.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
import type { MetaFunction } from "react-router";

import TableOfContents from "@/components/guides/TableOfContents";
import ImageGallery from "@/components/guides/ImageGallery";
import { CfImage } from "@/components/images/CfImage";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteMeta, buildRouteLinks, resolveMetaLangs } from "@/utils/routeHead";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { guideAbsoluteUrl, guideHref, type GuideKey } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";

import {
  ALSO_HELPFUL_TAGS,
  GUIDE_KEY as ROUTE_GUIDE_KEY,
  GUIDE_SLUG as ROUTE_GUIDE_SLUG,
  HERO_IMAGE_PATH,
  OG_IMAGE,
  RELATED_ITEMS,
  SECONDARY_IMAGE_PATH,
} from "./ferry-cancellations-weather.constants";
export { handle } from "./ferry-cancellations-weather.constants";
import { createGuideExtrasBuilder, createGuideFaqFallback } from "./ferry-cancellations-weather.guide-extras";

export const GUIDE_KEY = ROUTE_GUIDE_KEY satisfies GuideKey;
export const GUIDE_SLUG = ROUTE_GUIDE_SLUG;

const gallerySources = [
  buildCfImageUrl(HERO_IMAGE_PATH, OG_IMAGE.transform),
  buildCfImageUrl(SECONDARY_IMAGE_PATH, { width: 1200, height: 800, quality: 85, format: "auto" }),
] as const;

const buildGuideExtras = createGuideExtrasBuilder(gallerySources);
const guideFaqFallback = createGuideFaqFallback();

type FerryExtras = ReturnType<typeof buildGuideExtras>;

const extrasCache = new WeakMap<GuideSeoTemplateContext, FerryExtras>();

function collectFerryExtras(context: GuideSeoTemplateContext): FerryExtras {
  const cached = extrasCache.get(context);
  if (cached) return cached;
  const extras = buildGuideExtras(context);
  extrasCache.set(context, extras);
  return extras;
}

function renderFerryArticle(extras: FerryExtras, context: GuideSeoTemplateContext): JSX.Element {
  return (
    <>
      {extras.intro.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      {extras.tocItems.length > 0 ? <TableOfContents title={extras.tocTitle} items={extras.tocItems} /> : null}
      <CfImage src={HERO_IMAGE_PATH} preset="hero" width={1200} height={630} alt={context.article.title} />
      {extras.sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </section>
      ))}
      {extras.tips.length > 0 ? (
        <section id="tips">
          <h2>{extras.tipsTitle}</h2>
          <ul>
            {extras.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {extras.faqs.length > 0 ? (
        <section id="faqs">
          <h2>{extras.faqsTitle}</h2>
          {extras.faqs.map((faq, index) => (
            <details key={index}>
              <summary>{faq.q}</summary>
              {faq.a.map((answer, answerIndex) => (
                <p key={answerIndex}>{answer}</p>
              ))}
            </details>
          ))}
        </section>
      ) : null}
    </>
  );
}

function renderArticleExtras(context: GuideSeoTemplateContext): JSX.Element | null {
  const extras = collectFerryExtras(context);
  if (extras.galleryItems.length === 0) return null;
  return (
    <section id="gallery">
      <h2>{extras.galleryTitle}</h2>
      <ImageGallery items={extras.galleryItems} />
    </section>
  );
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for ferryCancellations");
}

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: collectFerryExtras,
  render: (context, extras) => renderFerryArticle(extras, context),
  selectTocItems: () => [],
  isStructured: (_extras, context) => context.hasLocalizedContent,
});

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleLead: structuredLead.articleLead,
    articleExtras: renderArticleExtras,
    guideFaqFallback,
    renderGenericContent: false,
    relatedGuides: { items: RELATED_ITEMS },
    alsoHelpful: {
      tags: [...ALSO_HELPFUL_TAGS],
      excludeGuide: RELATED_ITEMS.map((item) => item.key),
      includeRooms: true,
    },
    showTransportNotice: true,
    showPlanChoice: false,
  }),
  structuredArticle: structuredLead.structuredArticle,
  meta: (args) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: AppLanguage } | undefined;
    const { lang, pathLang } = resolveMetaLangs(args as Parameters<MetaFunction>[0], payload);
    const path = guideHref(pathLang, GUIDE_KEY);
    const url = guideAbsoluteUrl(pathLang, GUIDE_KEY);
    const imageSrc = buildCfImageUrl(HERO_IMAGE_PATH, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${GUIDE_KEY}.title`,
      description: `guides.meta.${GUIDE_KEY}.description`,
      url,
      path,
      image: { src: imageSrc, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: (args) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: AppLanguage } | undefined;
    const { lang, pathLang } = resolveMetaLangs(args as Parameters<MetaFunction>[0], payload);
    const path = guideHref(pathLang, GUIDE_KEY);
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };

export { getGuidesFallbackTranslator, getGuidesTranslator } from "./ferry-cancellations-weather.translators";
export { normaliseFaqs, normaliseGallery, normaliseSections } from "./ferry-cancellations-weather.normalisers";