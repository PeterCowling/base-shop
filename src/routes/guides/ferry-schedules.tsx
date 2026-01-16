// src/routes/guides/ferry-schedules.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import TableOfContents from "@/components/guides/TableOfContents";
import ImageGallery from "@/components/guides/ImageGallery";
import { CfImage } from "@/components/images/CfImage";
import { buildRouteMeta } from "@/utils/routeHead";
import { guideHref, guideAbsoluteUrl, type GuideKey } from "@/routes.guides-helpers";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";

import * as FerrySchedulesModule from "./ferry-schedules";
import {
  HERO_IMAGE_PATH,
  GUIDE_KEY as ROUTE_GUIDE_KEY,
  GUIDE_SLUG as ROUTE_GUIDE_SLUG,
} from "./ferry-schedules/constants";
import { buildFerrySchedulesGuideExtras as buildFerrySchedulesGuideExtrasImpl } from "./ferry-schedules/extras";
import { getGuidesFallbackTranslator } from "./ferry-schedules/i18n";
import { normaliseFaqs } from "./ferry-schedules/normalisers";
import type { GuideExtras } from "./ferry-schedules/types";

export const handle = { tags: ["transport", "ferry", "positano"] };

export const GUIDE_KEY = ROUTE_GUIDE_KEY satisfies GuideKey;
export const GUIDE_SLUG = ROUTE_GUIDE_SLUG;

const RELATED_GUIDES = [
  { key: "ferryCancellations" },
  { key: "chiesaNuovaArrivals" },
  { key: "chiesaNuovaDepartures" },
  { key: "ferryDockToBrikette" },
] as const;

const ALSO_HELPFUL_OPTIONS = {
  tags: ["transport", "ferry", "positano"],
  excludeGuide: ["ferryCancellations", "chiesaNuovaArrivals", "chiesaNuovaDepartures", "ferryDockToBrikette"],
  includeRooms: true,
} as const;

const GALLERY_SOURCES = ["hero", "secondary"] as const;

export const buildFerrySchedulesGuideExtras = (
  gallerySources: readonly string[],
  context: GuideSeoTemplateContext,
): GuideExtras => buildFerrySchedulesGuideExtrasImpl(gallerySources, context);

const extrasCache = new WeakMap<GuideSeoTemplateContext, Map<AppLanguage, GuideExtras>>();

function collectFerryExtras(context: GuideSeoTemplateContext): GuideExtras {
  const lang = context.lang;
  let cache = extrasCache.get(context);
  if (!cache) {
    cache = new Map<AppLanguage, GuideExtras>();
    extrasCache.set(context, cache);
  }
  const cached = cache.get(lang);
  if (cached) return cached;
  const extras = FerrySchedulesModule.buildFerrySchedulesGuideExtras(GALLERY_SOURCES, context);
  cache.set(lang, extras);
  return extras;
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

function buildGuideFaqFallback(lang: string) {
  const translator = getGuidesFallbackTranslator(lang as AppLanguage);
  const fallback = normaliseFaqs(translator(`${GUIDE_KEY}.faqs`, { returnObjects: true }));
  if (fallback.length > 0) return fallback;

  const englishTranslator = getGuidesFallbackTranslator("en");
  const englishFallback = normaliseFaqs(englishTranslator(`${GUIDE_KEY}.faqs`, { returnObjects: true }));
  return englishFallback.length > 0 ? englishFallback : undefined;
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for ferrySchedules");
}

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: collectFerryExtras,
  render: (context, extras) => {
    if (
      extras.intro.length === 0 &&
      extras.sections.length === 0 &&
      extras.tips.length === 0 &&
      extras.faqs.length === 0
    ) {
      return null;
    }
    return (
      <>
        {extras.intro.map((paragraph, index) => (
          <p key={`intro-${index}`}>{paragraph}</p>
        ))}

        {extras.tocItems.length > 0 ? (
          <TableOfContents title={extras.tocTitle} items={extras.tocItems} />
        ) : null}

        <CfImage
          src={HERO_IMAGE_PATH}
          preset="hero"
          width={OG_IMAGE.width}
          height={OG_IMAGE.height}
          alt={context.article.title}
        />

        {extras.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph, paragraphIndex) => (
              <p key={`section-${section.id}-${paragraphIndex}`}>{paragraph}</p>
            ))}
          </section>
        ))}

        {extras.tips.length > 0 ? (
          <section id="tips">
            <h2>{extras.tipsTitle}</h2>
            <ul>
              {extras.tips.map((tip, tipIndex) => (
                <li key={`tip-${tipIndex}`}>{tip}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {extras.faqs.length > 0 ? (
          <section id="faqs">
            <h3>{extras.faqsTitle}</h3>
            {extras.faqs.map((faq, faqIndex) => (
              <details key={`faq-${faqIndex}`}>
                <summary>{faq.q}</summary>
                {faq.a.map((answer, answerIndex) => (
                  <p key={`faq-${faqIndex}-answer-${answerIndex}`}>{answer}</p>
                ))}
              </details>
            ))}
          </section>
        ) : null}
      </>
    );
  },
  selectTocItems: (extras) => extras.tocItems,
  isStructured: (extras) =>
    extras.intro.length > 0 || extras.sections.length > 0 || extras.tips.length > 0 || extras.faqs.length > 0,
});

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: {
      path: HERO_IMAGE_PATH,
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      transform: {
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        quality: 85,
        format: "auto",
      },
    },
    renderGenericContent: false,
    showTransportNotice: true,
    showPlanChoice: false,
    articleLead: structuredLead.articleLead,
    articleExtras: renderArticleExtras,
    guideFaqFallback: buildGuideFaqFallback,
    relatedGuides: { items: RELATED_GUIDES.map((item) => ({ key: item.key })) },
    alsoHelpful: { ...ALSO_HELPFUL_OPTIONS },
  }),
  structuredArticle: structuredLead.structuredArticle,
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const areaSlug = getSlug(baseKey, lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
    const url = guideAbsoluteUrl(lang, manifestEntry.key);
    const image = buildCfImageUrl(HERO_IMAGE_PATH, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
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
  links: (args) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: string } | undefined;
    const lang = toAppLanguage(payload?.lang);
    const path = guideHref(lang, manifestEntry.key);
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };

export { getGuidesFallbackTranslator, getGuidesTranslator } from "./ferry-schedules/i18n";
export { normaliseFaqs, normaliseGallery, normaliseSections } from "./ferry-schedules/normalisers";
export { HERO_IMAGE_PATH, SECONDARY_IMAGE_PATH, OG_IMAGE } from "./ferry-schedules/constants";