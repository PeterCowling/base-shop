// src/routes/guides/amalfi-coast-cuisine-guide.tsx
import type { LinksFunction, MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { TFunction } from "i18next";

import { Grid } from "@acme/ui/atoms/Grid";

import GenericContent from "@/components/guides/GenericContent";
import ImageGallery from "@/components/guides/ImageGallery";
import TableOfContents from "@/components/guides/TableOfContents";
import BarMenuStructuredData from "@/components/seo/BarMenuStructuredData";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { OG_IMAGE } from "@/utils/headConstants";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import {
  GUIDE_KEY as GUIDE_KEY_CONST,
  GUIDE_SLUG as GUIDE_SLUG_CONST,
  handle,
  SIGNATURE_DISHES_SECTION_ID,
} from "./amalfi-coast-cuisine-guide.constants";
import { determineHasCuisineContent, getExtrasAvailability } from "./amalfi-coast-cuisine-guide.content";
import { buildEnglishFallbacks, buildFallbackStructuredContent } from "./amalfi-coast-cuisine-guide.fallbacks";
import { buildCuisineGallery } from "./amalfi-coast-cuisine-guide.gallery";
import { buildCuisineItemList } from "./amalfi-coast-cuisine-guide.item-list";
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import { normalizeFaqFallback } from "./guide-seo/seo/jsonld";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

export { handle };
export const GUIDE_KEY: GuideKey = GUIDE_KEY_CONST;
export const GUIDE_SLUG = GUIDE_SLUG_CONST;

function buildArticleLead(ctx: GuideSeoTemplateContext): JSX.Element | null {
  const hasLocalizedCuisineContent = ctx.hasLocalizedContent
    ? determineHasCuisineContent({
        intro: ctx.intro,
        sections: ctx.sections,
        faqs: ctx.faqs,
      })
    : false;

  if (!hasLocalizedCuisineContent) {
    return null;
  }

  return <GenericContent t={ctx.translator as unknown as TFunction} guideKey={GUIDE_KEY} />;
}

function buildAdditionalScripts(ctx: GuideSeoTemplateContext): JSX.Element | null {
  const englishGuidesT = i18n.getFixedT("en", "guides") as TFunction<"guides">;
  const englishFallbacks = buildEnglishFallbacks(englishGuidesT);
  const extrasAvailability = getExtrasAvailability(ctx.lang);
  if (!extrasAvailability.itemList) return null;

  const itemList = buildCuisineItemList({
    translator: ctx.translateGuides as unknown as TFunction<"guides">,
    lang: ctx.lang,
    englishFallbacks,
    hasItemList: extrasAvailability.itemList,
    title: ctx.article.title,
    description: ctx.article.description,
    pathname: new URL(ctx.canonicalUrl).pathname,
  });

  return itemList.json ? <BarMenuStructuredData json={itemList.json} /> : null;
}

function buildArticleExtras(ctx: GuideSeoTemplateContext): JSX.Element | null {
  const englishGuidesT = i18n.getFixedT("en", "guides") as TFunction<"guides">;
  const englishFallbacks = buildEnglishFallbacks(englishGuidesT);
  const hasCuisineContent = determineHasCuisineContent({
    intro: ctx.intro,
    sections: ctx.sections,
    faqs: ctx.faqs,
  });
  const extrasAvailability = getExtrasAvailability(ctx.lang);

  const sections: JSX.Element[] = [];

  if (!hasCuisineContent && ctx.toc.length === 0) {
    const fallback = buildFallbackStructuredContent(
      ctx.translateGuides as unknown as TFunction<"guides">,
      englishGuidesT,
    );
    if (fallback.toc.length > 0) {
      sections.push(
        <TableOfContents key="fallback-toc" items={fallback.toc} />,
      );
    }
  }

  const itemList = buildCuisineItemList({
    translator: ctx.translateGuides as unknown as TFunction<"guides">,
    lang: ctx.lang,
    englishFallbacks,
    hasItemList: extrasAvailability.itemList,
    title: ctx.article.title,
    description: ctx.article.description,
    pathname: new URL(ctx.canonicalUrl).pathname,
  });

  if (itemList.entries.length) {
    sections.push(
      <section id={SIGNATURE_DISHES_SECTION_ID} key={SIGNATURE_DISHES_SECTION_ID}>
        <h2>{itemList.title}</h2>
        <Grid as="ul" className="gap-3 md:grid-cols-2">
          {itemList.entries.map((entry, index) => (
            <li key={index} className="rounded-md border border-slate-200 p-4 dark:border-slate-700">
              <strong className="block text-base font-semibold">{entry.name}</strong>
              {entry.note ? (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{entry.note}</p>
              ) : null}
            </li>
          ))}
        </Grid>
      </section>,
    );
  }

  const gallery = buildCuisineGallery({
    translator: ctx.translateGuides as unknown as TFunction<"guides">,
    lang: ctx.lang,
    englishFallbacks,
    hasGallery: extrasAvailability.gallery,
  });

  if (gallery.items.length) {
    sections.push(
      <section id="gallery" key="gallery">
        {gallery.title ? <h2>{gallery.title}</h2> : null}
        <ImageGallery items={gallery.items} />
      </section>,
    );
  }

  return sections.length ? <>{sections}</> : null;
}

function buildGuideFaqFallback(lang: string): NormalizedFaqEntry[] {
  try {
    const translator = i18n.getFixedT(lang, "guides") as TFunction<"guides">;
    const entries = translator(`content.${GUIDE_KEY}.faq`, { returnObjects: true });
    return normalizeFaqFallback(entries);
  } catch {
    return [];
  }
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for cuisineAmalfiGuide"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
}

const { Component, clientLoader, meta: baseMeta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericContent: false,
    articleLead: buildArticleLead,
    articleExtras: buildArticleExtras,
    additionalScripts: buildAdditionalScripts,
    guideFaqFallback: buildGuideFaqFallback,
    relatedGuides: { items: manifestEntry.relatedGuides.map((key) => ({ key })) },
  }),
  clientLoader: async ({ request }: LoaderFunctionArgs) => {
    const lang = langFromRequest(request);
    await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
    await i18n.changeLanguage(lang);
    await ensureGuideContent(lang, manifestEntry.contentKey, {
      en: () => import(`../../locales/en/guides/content/${manifestEntry.contentKey}.json`),
      local:
        lang === "en"
          ? undefined
          : () =>
              import(`../../locales/${lang}/guides/content/${manifestEntry.contentKey}.json`).catch(
                () => undefined,
              ),
    });
    return { lang };
  },
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    const imageSrc = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: imageSrc, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export { clientLoader };
export const meta: MetaFunction = (...args) => baseMeta(...args);
export const links: LinksFunction = () => buildRouteLinks();
