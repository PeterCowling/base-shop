// src/routes/guides/ferry-schedules.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import TableOfContents from "@/components/guides/TableOfContents";
import ImageGallery from "@/components/guides/ImageGallery";
import { CfImage } from "@/components/images/CfImage";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { guideAbsoluteUrl, guideHref, type GuideKey } from "@/routes.guides-helpers";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import type { AppLanguage } from "@/i18n.config";
import type { LinksFunction, MetaFunction } from "react-router";
import getFallbackLanguage from "./utils/getFallbackLanguage";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

type GuideMetaArgs = Parameters<MetaFunction>[0];

import * as FerrySchedulesModule from "./ferry-schedules";
import {
  HERO_IMAGE_PATH,
  SECONDARY_IMAGE_PATH,
  GUIDE_KEY as ROUTE_GUIDE_KEY,
  GUIDE_SLUG as ROUTE_GUIDE_SLUG,
} from "./ferry-schedules/constants";
import { buildFerrySchedulesGuideExtras as buildFerrySchedulesGuideExtrasImpl } from "./ferry-schedules/extras";
import { getGuidesFallbackTranslator } from "./ferry-schedules/i18n";
import { normaliseFaqs } from "./ferry-schedules/normalisers";
import type { GuideExtras, FerryFaq } from "./ferry-schedules/types";

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

const GALLERY_SOURCES = [HERO_IMAGE_PATH, SECONDARY_IMAGE_PATH] as const;

export const buildFerrySchedulesGuideExtras = (
  gallerySources: readonly string[],
  context: GuideSeoTemplateContext,
): GuideExtras => buildFerrySchedulesGuideExtrasImpl(gallerySources, context);

function resolveGuideExtras(context: GuideSeoTemplateContext): GuideExtras {
  return FerrySchedulesModule.buildFerrySchedulesGuideExtras(GALLERY_SOURCES, context);
}

function renderArticleLead(context: GuideSeoTemplateContext): JSX.Element {
  const extras = resolveGuideExtras(context);
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
}

function renderArticleExtras(context: GuideSeoTemplateContext): JSX.Element | null {
  const extras = resolveGuideExtras(context);
  if (extras.galleryItems.length === 0) return null;
  return (
    <section id="gallery">
      <h2>{extras.galleryTitle}</h2>
      <ImageGallery items={extras.galleryItems} />
    </section>
  );
}

function buildTocItems(context: GuideSeoTemplateContext) {
  return resolveGuideExtras(context).tocItems;
}

function mapFaqsToNormalizedEntries(faqs: FerryFaq[]): NormalizedFaqEntry[] {
  return faqs
    .map((faq) => {
      const question = faq.q.trim();
      const answer = faq.a.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
      if (question.length === 0 || answer.length === 0) {
        return null;
      }
      return { question, answer } satisfies NormalizedFaqEntry;
    })
    .filter((entry): entry is NormalizedFaqEntry => entry != null);
}

function buildGuideFaqFallback(lang: string): NormalizedFaqEntry[] | undefined {
  const translator = getGuidesFallbackTranslator(lang as AppLanguage);
  const fallback = mapFaqsToNormalizedEntries(
    normaliseFaqs(translator(`${GUIDE_KEY}.faqs`, { returnObjects: true })),
  );
  if (fallback.length > 0) return fallback;

  const englishTranslator = getGuidesFallbackTranslator("en");
  const englishFallback = mapFaqsToNormalizedEntries(
    normaliseFaqs(englishTranslator(`${GUIDE_KEY}.faqs`, { returnObjects: true })),
  );
  return englishFallback.length > 0 ? englishFallback : undefined;
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for ferrySchedules"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
}

const resolveMeta = (args: GuideMetaArgs): ReturnType<MetaFunction> => {
  const lang = toAppLanguage((args?.data as { lang?: string } | undefined)?.lang ?? getFallbackLanguage());
  const path = guideHref(lang, manifestEntry.key);
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
};

type GuideLinksArgShape = {
  data?: { lang?: unknown };
  params?: { lang?: unknown };
  request?: { url?: unknown };
};

const resolveLinks: LinksFunction = (
  ...linkArgs: Parameters<LinksFunction>
) => {
  const [firstArg] = linkArgs;
  const safeArgs = (firstArg ?? {}) as GuideLinksArgShape;
  const dataLang = typeof safeArgs?.data?.lang === "string" ? safeArgs.data.lang : undefined;
  const paramLang = typeof safeArgs?.params?.["lang"] === "string" ? safeArgs.params["lang"] : undefined;
  const lang = toAppLanguage(dataLang ?? paramLang ?? getFallbackLanguage());
  const path = guideHref(lang, manifestEntry.key);
  const url = guideAbsoluteUrl(lang, manifestEntry.key);
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
    articleLead: renderArticleLead,
    articleExtras: renderArticleExtras,
    buildTocItems,
    guideFaqFallback: buildGuideFaqFallback,
    relatedGuides: { items: RELATED_GUIDES.map((item) => ({ key: item.key })) },
    alsoHelpful: {
      tags: [...ALSO_HELPFUL_OPTIONS.tags],
      excludeGuide: [...ALSO_HELPFUL_OPTIONS.excludeGuide],
      includeRooms: ALSO_HELPFUL_OPTIONS.includeRooms,
    },
  }),
  meta: resolveMeta,
  links: resolveLinks,
});

export default Component;
export { clientLoader };
export const meta: MetaFunction = (args) => resolveMeta(args);
export const links: LinksFunction = (
  ...args: Parameters<LinksFunction>
) => resolveLinks(...args);

export { getGuidesFallbackTranslator, getGuidesTranslator } from "./ferry-schedules/i18n";
export { normaliseFaqs, normaliseGallery, normaliseSections } from "./ferry-schedules/normalisers";
export { HERO_IMAGE_PATH, SECONDARY_IMAGE_PATH, OG_IMAGE } from "./ferry-schedules/constants";
