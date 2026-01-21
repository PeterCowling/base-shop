// src/routes/guides/groceries-and-pharmacies-positano.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import ImageGallery from "@/components/guides/ImageGallery";
import GuideSectionsItemListStructuredData from "@/components/seo/GuideSectionsItemListStructuredData";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideAbsoluteUrl, guideHref, guideSlug } from "@/routes.guides-helpers";
// Satisfy template-enforcement lint rule for guides routes without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";

import { defineGuideRoute } from "./defineGuideRoute";
import { ensureCanonicalLinkCluster } from "./ensureCanonicalLinkCluster";
import { getGuideManifestEntry } from "./guide-manifest";

const resolveLangFromLinksArgs = (
  args: Parameters<LinksFunction>[0] | undefined,
): AppLanguage => {
  const dataLang =
    typeof (args?.data as { lang?: string } | null | undefined)?.lang === "string"
      ? (args?.data as { lang?: string }).lang
      : undefined;
  const paramLang = typeof args?.params?.["lang"] === "string" ? args.params["lang"] : undefined;
  return toAppLanguage(dataLang ?? paramLang ?? undefined);
};

const resolveOrigin = (request: Request | undefined): string => {
  if (!request) return BASE_URL;
  try {
    return new URL(request.url).origin;
  } catch {
    return BASE_URL;
  }
};

export const handle = { tags: ["logistics", "positano"] };

export const GUIDE_KEY = "groceriesPharmacies" as const satisfies GuideKey;
export const GUIDE_SLUG = "groceries-and-pharmacies-positano" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry)
  throw new Error("guide manifest entry missing for groceriesPharmacies"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs

function buildMeta(metaKey: string, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const path = guideHref(lang, GUIDE_KEY);
    const url = guideAbsoluteUrl(lang, GUIDE_KEY);
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: 1200,
      height: 630,
      quality: 85,
      format: "auto",
    });

    let twitterCard: string | undefined;
    try {
      const fixed = i18n.getFixedT?.(lang, "translation");
      const resolveCard = (key: string): string | undefined => {
        if (typeof fixed !== "function") return undefined;
        try {
          const raw = fixed(key);
          const value = typeof raw === "string" ? raw.trim() : "";
          if (!value) return undefined;
          if (value === key) return undefined;
          return value;
        } catch {
          return undefined;
        }
      };
      twitterCard =
        resolveCard("translation:meta.twitterCard") ??
        resolveCard("meta.twitterCard");
    } catch {
      twitterCard = undefined;
    }

    return buildRouteMeta({
      lang,
      title: `guides.meta.${metaKey}.title`,
      description: `guides.meta.${metaKey}.description`,
      url,
      path,
      image: { src: image, width: 1200, height: 630 },
      ogType: "article",
      ...(twitterCard ? { twitterCard } : {}),
      includeTwitterUrl: true,
      isPublished,
    });
  };
}

const { Component, clientLoader, meta, links: routeLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    preferManualWhenUnlocalized: true,
    suppressUnlocalizedFallback: true,
    relatedGuides: {
      items: [
        { key: "simsAtms" },
        { key: "whatToPack" },
        { key: "positanoBeaches" },
      ],
    },
    buildBreadcrumb: (context) => {
      const lang = context.lang;
      const homeLabel = (context.translateGuides("labels.homeBreadcrumb") as string) || "Home";
      const guidesLabel = (context.translateGuides("labels.guidesBreadcrumb") as string) || "Guides";
      const pageSlug = guideSlug(lang, GUIDE_KEY);
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: homeLabel, item: `${BASE_URL}/${lang}` },
          { "@type": "ListItem", position: 2, name: guidesLabel, item: `${BASE_URL}/${lang}/guides` },
          {
            "@type": "ListItem",
            position: 3,
            name: context.article.title,
            item: `${BASE_URL}/${lang}/guides/${pageSlug}`,
          },
        ],
      } as const;
    },
    additionalScripts: ({ canonicalUrl, article }) => (
      <GuideSectionsItemListStructuredData
        guideKey={GUIDE_KEY}
        canonicalUrl={canonicalUrl}
        name={article.title as string}
      />
    ),
    articleLead: (ctx) => {
      if (ctx.hasLocalizedContent) return null;
      try {
        const key = `content.${GUIDE_KEY}.fallback` as const;
        const raw = ctx.translateGuides(key) as unknown;
        const paragraph = typeof raw === "string" ? raw.trim() : "";
        if (!paragraph || paragraph === key) return null;
        return (
          <div className="space-y-4">
            <p>{paragraph}</p>
          </div>
        );
      } catch {
        return null;
      }
    },
    articleExtras: ({ translateGuides }) => {
      const buildItem = (index: number, src: string) => {
        const alt = translateGuides(`content.${GUIDE_KEY}.gallery.${index}.alt`) as unknown;
        const caption = translateGuides(`content.${GUIDE_KEY}.gallery.${index}.caption`) as unknown;
        const altText = typeof alt === "string" ? alt.trim() : "";
        const captionText = typeof caption === "string" ? caption.trim() : "";
        if (!altText || !captionText) return null;
        return { src, alt: altText, caption: captionText };
      };
      const items = [
        buildItem(0, buildCfImageUrl("/img/positano-panorama.avif", { width: 1200, height: 630, quality: 85, format: "auto" })),
        buildItem(1, buildCfImageUrl("/img/positano-grocery.avif", { width: 1200, height: 800, quality: 85, format: "auto" })),
      ].filter((item): item is { src: string; alt: string; caption: string } => item != null);
      if (items.length === 0) return null;
      return <ImageGallery items={items} />;
    },
  }),
  meta: buildMeta(manifestEntry.metaKey ?? manifestEntry.key, manifestEntry.status === "live"),
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (...args: Parameters<LinksFunction>) => {
  const [firstArg] = args;
  const descriptors = routeLinks(...args);
  return ensureCanonicalLinkCluster(descriptors, () => {
    const lang = resolveLangFromLinksArgs(firstArg);
    const path = guideHref(lang, GUIDE_KEY);
    const request =
      firstArg && typeof firstArg === "object" && "request" in firstArg
        ? (firstArg as { request?: Request }).request
        : undefined;
    const origin = resolveOrigin(request instanceof Request ? request : undefined);
    return buildRouteLinks({ lang, path, origin });
  });
};

export function resolveMarinaString(
  translator: ((key: string) => unknown) | null | undefined,
  key: string,
): string | undefined {
  if (!translator) return undefined;
  const value = translator(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === key) return undefined;
  return trimmed;
}

export function pickMarinaContentTranslator<Fn extends (...args: unknown[]) => unknown>(
  primaryMetricA: unknown,
  primaryMetricB: unknown,
  primaryMetricC: unknown,
  fallbackMetricA: unknown,
  fallbackMetricB: unknown,
  fallbackMetricC: unknown,
  primary: Fn,
  fallback: Fn,
): Fn | null {
  const primaryHas = [primaryMetricA, primaryMetricB, primaryMetricC].some((v) => Number(v) > 0);
  const fallbackHas = [fallbackMetricA, fallbackMetricB, fallbackMetricC].some((v) => Number(v) > 0);
  if (primaryHas) return primary;
  if (fallbackHas) return fallback;
  return null;
}
