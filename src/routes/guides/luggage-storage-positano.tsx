// src/routes/guides/luggage-storage-positano.tsx
import i18n from "@/i18n";
import ServiceStructuredData from "@/components/seo/ServiceStructuredData";
import ImageGallery from "@/components/guides/ImageGallery";
import AlsoHelpful from "@/components/common/AlsoHelpful";
import CfImage from "@/components/images/CfImage";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import type { TFunction } from "i18next";

import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
import {
  DEFAULT_IMAGE_FORMAT,
  GUIDE_KEY as GUIDE_KEY_CONST,
  GUIDE_SLUG as GUIDE_SLUG_CONST,
  HERO_IMAGE_DIMENSIONS,
  HERO_IMAGE_PATH,
  OG_IMAGE_DIMENSIONS,
  OG_IMAGE_PATH,
  handle,
} from "./luggage-storage-positano.constants";
import { buildLuggageStorageContent } from "./luggage-storage-positano.content";
import { buildLuggageStorageFaqEntries as buildFaqEntries } from "./luggage-storage-positano.faq";
import { resolveLuggageStorageString } from "./luggage-storage-positano.strings";
import { buildLuggageStorageGallery } from "./luggage-storage-positano.gallery";
import { BASE_URL } from "@/config/site";

export { handle };
export const GUIDE_KEY: GuideKey = GUIDE_KEY_CONST;
export const GUIDE_SLUG = GUIDE_SLUG_CONST;
export { buildFaqEntries as buildLuggageStorageFaqEntries, resolveLuggageStorageString };

const HERO_IMAGE = buildCfImageUrl(HERO_IMAGE_PATH, {
  ...HERO_IMAGE_DIMENSIONS,
  quality: 85,
  format: DEFAULT_IMAGE_FORMAT,
});

const OG_IMAGE = buildCfImageUrl(OG_IMAGE_PATH, {
  ...OG_IMAGE_DIMENSIONS,
  quality: 85,
  format: DEFAULT_IMAGE_FORMAT,
});

const manifestEntry = getGuideManifestEntry("luggageStorage");
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for luggageStorage");
}

type LuggageContent = ReturnType<typeof buildLuggageStorageContent>;
type GalleryItems = ReturnType<typeof buildLuggageStorageGallery>;

type LuggageExtras = {
  hasStructured: boolean;
  content: LuggageContent;
  gallery: GalleryItems;
};

function getEnglishGuidesTranslator(): TFunction<"guides"> {
  try {
    return i18n.getFixedT("en", "guides") as TFunction<"guides">;
  } catch {
    return ((key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === "string" ? options.defaultValue : key) as TFunction<"guides">;
  }
}

const extrasCache = new WeakMap<GuideSeoTemplateContext, LuggageExtras>();

function collectLuggageExtras(context: GuideSeoTemplateContext): LuggageExtras {
  if (extrasCache.has(context)) return extrasCache.get(context)!;
  const englishGuides = getEnglishGuidesTranslator();
  const content = buildLuggageStorageContent({
    translator: context.translateGuides as TFunction<"guides">,
    englishTranslator: englishGuides,
  });
  const gallery = buildLuggageStorageGallery({
    translator: context.translateGuides as TFunction<"guides">,
    englishTranslator: englishGuides,
    hero: HERO_IMAGE,
    ogImage: OG_IMAGE,
    fallbackTitle: (context.translateGuides("labels.indexTitle") as string) || "",
  });
  const extras: LuggageExtras = {
    hasStructured:
      context.hasLocalizedContent ||
      content.intro.length > 0 ||
      content.sections.length > 0 ||
      content.faqs.length > 0,
    content,
    gallery,
  };
  extrasCache.set(context, extras);
  return extras;
}

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: collectLuggageExtras,
  render: (context, extras) => {
    const { content } = extras;
    if (
      content.intro.length === 0 &&
      content.toc.length === 0 &&
      content.sections.length === 0 &&
      content.faqs.length === 0
    ) {
      return null;
    }
    return (
      <>
        {content.intro.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {content.toc.length ? (
          <nav aria-label={content.onThisPageLabel} className="not-prose">
            <ul>
              {content.toc.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <CfImage
          src={HERO_IMAGE_PATH}
          alt={content.heroAlt || (context.article.title as string)}
          width={HERO_IMAGE_DIMENSIONS.width}
          height={HERO_IMAGE_DIMENSIONS.height}
          preset="hero"
          data-aspect="3/2"
        />
      </>
    );
  },
  selectTocItems: () => [],
  isStructured: (extras) => extras.hasStructured,
});

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => {
    const englishGuides = getEnglishGuidesTranslator();
    return {
      renderGenericContent: false,
      alwaysProvideFaqFallback: true,
      ogImage: {
        path: OG_IMAGE_PATH,
        width: OG_IMAGE_DIMENSIONS.width,
        height: OG_IMAGE_DIMENSIONS.height,
      },
      buildBreadcrumb: (ctx) => ({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: englishGuides("labels.homeBreadcrumb") as string,
            item: `https://hostel-positano.com/${ctx.lang}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: englishGuides("labels.guidesBreadcrumb") as string,
            item: `https://hostel-positano.com/${ctx.lang}/guides`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: ctx.article.title,
            item: new URL(ctx.canonicalUrl).toString(),
          },
        ],
      }),
      additionalScripts: (ctx) => {
        const { content } = collectLuggageExtras(ctx);
        return (
          <ServiceStructuredData
            name={ctx.article.title}
            description={ctx.article.description}
            image={OG_IMAGE}
            areaServed={content.areaServed}
            serviceType={content.serviceType}
            url={ctx.canonicalUrl}
            inLanguage={ctx.lang}
          />
        );
      },
      articleLead: structuredLead.articleLead,
      articleExtras: (ctx) => {
        const extras = collectLuggageExtras(ctx);
        const { content, gallery } = extras;
        return (
          <>
            {content.sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2>{section.title}</h2>
                {section.body.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </section>
            ))}
            {content.faqs.length ? (
              <section id="faqs">
                <h2>{content.faqsHeading}</h2>
                {content.faqs.map((faq, index) => (
                  <details key={index}>
                    <summary>{faq.q}</summary>
                    {faq.a.map((answer, answerIndex) => (
                      <p key={answerIndex}>{answer}</p>
                    ))}
                  </details>
                ))}
              </section>
            ) : null}
            <ImageGallery items={gallery} />
            <AlsoHelpful
              lang={ctx.lang}
              tags={["porters", "logistics", "positano"]}
              excludeGuide={["porterServices", "ferryDockToBrikette", "chiesaNuovaArrivals", "chiesaNuovaDepartures"]}
              includeRooms
            />
          </>
        );
      },
      guideFaqFallback: (lang) => {
        const translator = i18n.getFixedT(lang ?? "en", "guides") as TFunction<"guides">;
        const plural = translator("content.luggageStorage.faqs", { returnObjects: true }) as unknown;
        const single = translator("content.luggageStorage.faq", { returnObjects: true }) as unknown;
        return buildFaqEntries(plural, single);
      },
    };
  },
  structuredArticle: structuredLead.structuredArticle,
  meta: ({ data }) => {
    const d = (data ?? {}) as { lang?: AppLanguage };
    const lang = d.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: OG_IMAGE, width: OG_IMAGE_DIMENSIONS.width, height: OG_IMAGE_DIMENSIONS.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: (args) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: AppLanguage } | undefined;
    const lang = payload?.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };