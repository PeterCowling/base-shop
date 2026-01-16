// src/routes/guides/day-trip-capri-from-positano.tsx
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";

import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
import { renderGuideLinkTokens } from "./utils/linkTokens";

import GenericContent from "@/components/guides/GenericContent";
import ImageGallery from "@/components/guides/ImageGallery";
import TableOfContents from "@/components/guides/TableOfContents";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { LinksFunction, MetaFunction } from "react-router";

import {
  ALSO_HELPFUL_TAGS,
  GUIDE_KEY as GUIDE_KEY_INNER,
  GUIDE_SLUG as GUIDE_SLUG_INNER,
  OG_IMAGE,
  RELATED_GUIDES,
  handle,
} from "./day-trip-capri-from-positano/constants";
import { buildGuideExtras } from "./day-trip-capri-from-positano/buildGuideExtras";
import { createGuideFaqFallback } from "./day-trip-capri-from-positano/guideFaqFallback";

export { handle };
export const GUIDE_KEY: GuideKey = GUIDE_KEY_INNER;
export const GUIDE_SLUG = GUIDE_SLUG_INNER;

function renderStructuredCapriArticle(extras: ReturnType<typeof buildGuideExtras>, context: GuideSeoTemplateContext) {
  return (
    <>
      {extras.showTranslatedToc && Array.isArray(extras.translatedToc) && extras.translatedToc.length > 0 ? (
        <TableOfContents items={extras.translatedToc} />
      ) : null}
      <GenericContent t={context.translator} guideKey={GUIDE_KEY} showToc={!extras.showTranslatedToc} />
    </>
  );
}

function renderFallbackCapriArticle(extras: CapriExtras, context: GuideSeoTemplateContext) {
  return (
    <>
      {extras.fallbackIntro.map((paragraph, index) => (
        <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}</p>
      ))}
      {Array.isArray(extras.fallbackToc) && extras.fallbackToc.length > 0 ? (
        <TableOfContents items={extras.fallbackToc} />
      ) : null}
      {extras.fallbackSections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.body.map((paragraph, index) => (
            <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `section-${section.id}-${index}`)}</p>
          ))}
          {section.list.length > 0 ? (
            <ul>
              {section.list.map((item, index) => (
                <li key={index}>{renderGuideLinkTokens(item, context.lang, `section-${section.id}-list-${index}`)}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </>
  );
}

function buildArticleExtras(context: GuideSeoTemplateContext): JSX.Element | null {
  const extras = collectCapriExtras(context);
  const shouldRenderGallery = extras.galleryItems.length > 0;
  const shouldRenderFallbackFaqs = !extras.hasGeneric && extras.fallbackFaqs.length > 0;

  if (!shouldRenderGallery && !shouldRenderFallbackFaqs) {
    return null;
  }

  return (
    <>
      {shouldRenderGallery ? (
        <section id="gallery">
          {extras.galleryTitle ? <h2>{extras.galleryTitle}</h2> : null}
          <ImageGallery items={extras.galleryItems} />
        </section>
      ) : null}

      {shouldRenderFallbackFaqs ? (
        <section id="faqs">
          <h2>{extras.fallbackFaqsTitle}</h2>
          {extras.fallbackFaqs.map((faq, index) => (
            <details key={index}>
              <summary>{faq.q}</summary>
              {faq.a.map((answer, answerIndex) => (
                <p key={answerIndex}>{renderGuideLinkTokens(answer, context.lang, `faq-${index}-${answerIndex}`)}</p>
              ))}
            </details>
          ))}
        </section>
      ) : null}
    </>
  );
}

function buildHowToSteps(context: GuideSeoTemplateContext) {
  const extras = collectCapriExtras(context);
  if (extras.howToSteps.length === 0) return null;
  return extras.howToSteps;
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for capriDayTrip");
}

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: collectCapriExtras,
  render: (context, extras) => {
    return extras.hasGeneric
      ? renderStructuredCapriArticle(extras, context)
      : renderFallbackCapriArticle(extras, context);
  },
  selectTocItems: () => [],
  isStructured: (extras) => extras.hasGeneric,
});

const meta: MetaFunction = ({ data }) => {
  const payload = (data ?? {}) as { lang?: AppLanguage };
  const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
  const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
  const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
  const url = `${BASE_URL}${path}`;
  return buildRouteMeta({
    lang,
    title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
    description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
    url,
    path,
    image: {
      src: buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform),
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
    },
    ogType: "article",
    includeTwitterUrl: true,
    isPublished: manifestEntry.status === "live",
  });
};

const links: LinksFunction = (args) => {
  const payload = (args?.data ?? {}) as { lang?: AppLanguage } | undefined;
  const lang = payload?.lang ?? (i18nConfig.fallbackLng as AppLanguage);
  const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
  const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
  return buildRouteLinks({ lang, path, origin: BASE_URL });
};

const { Component, clientLoader } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleLead: structuredLead.articleLead,
    renderGenericContent: false,
    articleExtras: buildArticleExtras,
    buildHowToSteps,
    guideFaqFallback: createGuideFaqFallback,
    relatedGuides: { items: RELATED_GUIDES },
    alsoHelpful: {
      tags: [...ALSO_HELPFUL_TAGS],
      excludeGuide: RELATED_GUIDES.map((item) => item.key),
      includeRooms: true,
    },
    twitterCardDefault: "summary_large_image",
  }),
  structuredArticle: structuredLead.structuredArticle,
  meta: (args) => meta(args),
  links: (args) => links(args),
});

export default Component;
export { clientLoader, meta, links };
  structuredArticle: {
    guideKey: GUIDE_KEY,
    getExtras: (context) => buildGuideExtras(context),
    renderStructured: (extras, context) => renderStructuredCapriArticle(extras, context),
    renderFallback: (context, extras) => renderFallbackCapriArticle(extras, context),
    selectTocItems: (extras) => (extras.hasGeneric ? extras.translatedToc : extras.fallbackToc),
    isStructured: (extras) => extras.hasGeneric,
  },