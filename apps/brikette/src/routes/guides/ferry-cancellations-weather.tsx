// src/routes/guides/ferry-cancellations-weather.tsx
import { memo, useCallback, useMemo } from "react";
import type { LinksFunction,MetaFunction } from "react-router";

import ImageGallery from "@/components/guides/ImageGallery";
import TableOfContents from "@/components/guides/TableOfContents";
import { CfImage } from "@/components/images/CfImage";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideAbsoluteUrl,guideHref } from "@/routes.guides-helpers";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";

import GuideSeoTemplate, { type GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import {
  ALSO_HELPFUL_TAGS,
  GUIDE_KEY as ROUTE_GUIDE_KEY,
  GUIDE_SLUG as ROUTE_GUIDE_SLUG,
  HERO_IMAGE_PATH,
  OG_IMAGE,
  RELATED_ITEMS,
  SECONDARY_IMAGE_PATH,
} from "./ferry-cancellations-weather.constants";
import { createGuideExtrasBuilder, createGuideFaqFallback } from "./ferry-cancellations-weather.guide-extras";

// Template enforcement wants these as top-level exports on each guide
export const GUIDE_KEY = ROUTE_GUIDE_KEY satisfies GuideKey;
export const GUIDE_SLUG = ROUTE_GUIDE_SLUG;

function FerryCancellationsGuide(): JSX.Element {
  const gallerySources = useMemo(
    () => [
      buildCfImageUrl(HERO_IMAGE_PATH, OG_IMAGE.transform),
      buildCfImageUrl(SECONDARY_IMAGE_PATH, { width: 1200, height: 800, quality: 85, format: "auto" }),
    ],
    [],
  );

  const buildGuideExtras = useMemo(() => createGuideExtrasBuilder(gallerySources), [gallerySources]);

  const articleLead = useCallback(
    (context: GuideSeoTemplateContext) => {
      const extras = buildGuideExtras(context);
      const { intro, sections, tips, tipsTitle, faqs, faqsTitle, tocItems, tocTitle } = extras;
      return (
        <>
          {intro.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {tocItems.length > 0 ? <TableOfContents title={tocTitle} items={tocItems} /> : null}
          <CfImage src={HERO_IMAGE_PATH} preset="hero" width={1200} height={630} alt={context.article.title} />
          {sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </section>
          ))}
          {tips.length > 0 ? (
            <section id="tips">
              <h2>{tipsTitle}</h2>
              <ul>
                {tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {faqs.length > 0 ? (
            <section id="faqs">
              <h2>{faqsTitle}</h2>
              {faqs.map((faq, index) => (
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
    },
    [buildGuideExtras],
  );

  const articleExtras = useCallback(
    (context: GuideSeoTemplateContext) => {
      const { galleryItems, galleryTitle } = buildGuideExtras(context);
      if (galleryItems.length === 0) return null;
      return (
        <section id="gallery">
          <h2>{galleryTitle}</h2>
          <ImageGallery items={galleryItems} />
        </section>
      );
    },
    [buildGuideExtras],
  );

  const guideFaqFallback = useMemo(createGuideFaqFallback, []);

  const buildTocItems = useCallback(
    (context: GuideSeoTemplateContext) => buildGuideExtras(context).tocItems,
    [buildGuideExtras],
  );

  const alsoHelpful = useMemo(
    () => ({
      tags: [...ALSO_HELPFUL_TAGS],
      excludeGuide: RELATED_ITEMS.map((item) => item.key),
      includeRooms: true,
    }),
    [],
  );

  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      ogImage={OG_IMAGE}
      articleLead={articleLead}
      articleExtras={articleExtras}
      buildTocItems={buildTocItems}
      guideFaqFallback={guideFaqFallback}
      renderGenericContent={false}
      showPlanChoice={false}
      showTransportNotice
      relatedGuides={{ items: RELATED_ITEMS }}
      alsoHelpful={alsoHelpful}
    />
  );
}

export default memo(FerryCancellationsGuide);

export { normaliseFaqs, normaliseGallery, normaliseSections } from "./ferry-cancellations-weather.normalisers";
export { getGuidesFallbackTranslator, getGuidesTranslator } from "./ferry-cancellations-weather.translators";

// Head exports – ensure canonical + hreflang and twitter:card present
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const d = (data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const path = guideHref(lang, GUIDE_KEY);
  const url = guideAbsoluteUrl(lang, GUIDE_KEY);
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
  });
};

export const links: LinksFunction = () => buildRouteLinks();

