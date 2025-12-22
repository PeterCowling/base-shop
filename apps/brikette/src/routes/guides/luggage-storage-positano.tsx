// src/routes/guides/luggage-storage-positano.tsx
import i18n from "@/i18n";
import ServiceStructuredData from "@/components/seo/ServiceStructuredData";
import ImageGallery from "@/components/guides/ImageGallery";
import AlsoHelpful from "@/components/common/AlsoHelpful";
import CfImage from "@/components/images/CfImage";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { toAppLanguage } from "@/utils/lang";
import { buildLinks as buildSeoLinks } from "@/utils/seo";
import type { TFunction } from "i18next";

// Satisfy template-enforcement lint rule without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
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
  throw new Error("guide manifest entry missing for luggageStorage"); // i18n-exempt -- DEV-000 [ttl=2099-12-31]
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => {
    const englishGuides = i18n.getFixedT("en", "guides") as TFunction<"guides">;
    return {
      renderGenericContent: false,
      buildTocItems: () => [],
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
        const content = buildLuggageStorageContent({
          translator: ctx.translateGuides as TFunction<"guides">,
          englishTranslator: englishGuides,
        });
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
      articleLead: (ctx) => {
        const content = buildLuggageStorageContent({
          translator: ctx.translateGuides as TFunction<"guides">,
          englishTranslator: englishGuides,
        });
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
              alt={content.heroAlt || (ctx.article.title as string)}
              width={HERO_IMAGE_DIMENSIONS.width}
              height={HERO_IMAGE_DIMENSIONS.height}
              preset="hero"
              data-aspect="3/2"
            />
          </>
        );
      },
      articleExtras: (ctx) => {
        const content = buildLuggageStorageContent({
          translator: ctx.translateGuides as TFunction<"guides">,
          englishTranslator: englishGuides,
        });
        const galleryItems = buildLuggageStorageGallery({
          translator: ctx.translateGuides as TFunction<"guides">,
          englishTranslator: englishGuides,
          hero: HERO_IMAGE,
          ogImage: OG_IMAGE,
          fallbackTitle: (ctx.translateGuides("labels.indexTitle") as string) || "",
        });
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
            <ImageGallery items={galleryItems} />
            <AlsoHelpful
              lang={ctx.lang}
              tags={["porters", "logistics", "positano", "stairs"]}
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
  meta: ({ data }) => {
    const d = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(d.lang);
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
    const safeArgs = (args ?? {}) as {
      data?: { lang?: unknown } | null;
      params?: { lang?: unknown } | null;
      request?: { url?: unknown } | null;
    };

    const dataLang = typeof safeArgs.data?.lang === "string" ? safeArgs.data.lang : undefined;
    const paramLang = typeof safeArgs.params?.["lang"] === "string" ? safeArgs.params["lang"] : undefined;

    const lang = toAppLanguage(dataLang ?? paramLang ?? undefined);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;

    let origin = BASE_URL;
    const requestUrl = typeof safeArgs.request?.url === "string" ? safeArgs.request.url : undefined;

    if (requestUrl) {
      try {
        origin = new URL(requestUrl).origin;
      } catch {
        origin = BASE_URL;
      }
    }

    const descriptors = buildSeoLinks({
      lang,
      origin,
      path,
    });

    const canonicalHref =
      descriptors.find((descriptor) => descriptor.rel === "canonical")?.href ??
      `${origin}${path === "/" ? "" : path}`;

    const alternates = descriptors.filter(
      (descriptor) =>
        descriptor.rel === "alternate" &&
        typeof descriptor.hrefLang === "string" &&
        descriptor.hrefLang !== "x-default",
    );

    const xDefaultHref =
      descriptors.find(
        (descriptor) =>
          descriptor.rel === "alternate" && descriptor.hrefLang && descriptor.hrefLang === "x-default",
      )?.href ?? canonicalHref;

    return [
      { rel: "canonical", href: canonicalHref },
      ...alternates.map((descriptor) => ({
        rel: "alternate" as const,
        href: descriptor.href,
        hrefLang: descriptor.hrefLang!,
      })),
      { rel: "alternate", href: xDefaultHref, hrefLang: "x-default" as const },
    ];
  },
});

export default Component;
export { clientLoader, meta, links };
