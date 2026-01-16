// /src/utils/seo.ts
/* ────────────────────────────────────────────────────────────────
   SEO helpers – canonical, hreflang, breadcrumb, meta
   Handles one-level slugs and nested Assistance-article slugs.
   ---------------------------------------------------------------- */

import { i18nConfig, type AppLanguage } from "@/i18n.config";
import React from "react";
import { ARTICLE_SLUGS } from "@/article-slug-map";
// Use a namespace import to avoid hard failures when tests partially mock
// the module without all named exports (e.g. ARTICLE_KEYS).
// Build a reverse-lookup for assistance article slugs without importing
// assistance helpers (keeps tests resilient to partial mocks)
import { SLUGS } from "@/slug-map";
import { guideSlug, type GuideKey, GUIDE_SLUG_LOOKUP_BY_LANG } from "@/guides/slugs";
import type { SlugKey, SlugMap } from "@/types/slugs";
type ArticleSlugEntry = Readonly<Partial<Record<AppLanguage, string>>> & { readonly en: string };
const ARTICLE_SLUGS_BY_KEY = ARTICLE_SLUGS as unknown as Record<string, ArticleSlugEntry>;
/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export interface HtmlLinkDescriptor {
  rel: "canonical" | "alternate";
  href: string;
  hrefLang?: string;
  key?: string;
  [key: string]: string | undefined;
}

export interface BreadcrumbList {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  inLanguage?: string;
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

/* ------------------------------------------------------------------ */
/* Reverse-lookup maps for slug → key                                 */
/* ------------------------------------------------------------------ */
const slugLookup: Record<AppLanguage, Record<string, SlugKey>> = {} as Record<
  AppLanguage,
  Record<string, SlugKey>
>;
const guideLookup: Record<AppLanguage, Record<string, GuideKey>> =
  GUIDE_SLUG_LOOKUP_BY_LANG as unknown as Record<AppLanguage, Record<string, GuideKey>>;
const assistanceArticleLookup: Record<AppLanguage, Record<string, string>> = {} as Record<
  AppLanguage,
  Record<string, string>
>;

const slugs: SlugMap = SLUGS;
(Object.keys(slugs) as SlugKey[]).forEach((key) => {
  (Object.keys(slugs[key]) as AppLanguage[]).forEach((lng) => {
    slugLookup[lng] ??= {};
    slugLookup[lng][slugs[key][lng]] = key;
  });
});

// Resolve a safe list of languages (tests may partially mock i18nConfig)
const SUPPORTED_LANGS_SAFE: readonly AppLanguage[] = (() => {
  const raw = (i18nConfig as { supportedLngs?: unknown }).supportedLngs;
  const arr = Array.isArray(raw) ? (raw as readonly string[]) : ["en"];
  return (arr.length > 0 ? arr : ["en"]) as readonly AppLanguage[];
})();

// Assistance article slug reverse-lookup based on ARTICLE_SLUGS map
for (const lng of SUPPORTED_LANGS_SAFE as readonly AppLanguage[]) {
  assistanceArticleLookup[lng] = {} as Record<string, string>;
}
Object.keys(ARTICLE_SLUGS).forEach((k) => {
  const key = k as unknown as string; // HelpArticleKey at runtime
  for (const lng of SUPPORTED_LANGS_SAFE as readonly AppLanguage[]) {
    const slug = ARTICLE_SLUGS_BY_KEY[key]?.[lng] ?? ARTICLE_SLUGS_BY_KEY[key]?.en;
    if (typeof slug === "string" && slug) {
      assistanceArticleLookup[lng][slug] = key;
    }
  }
});

/* ------------------------------------------------------------------ */
/* Helper utilities                                                   */
/* ------------------------------------------------------------------ */
const trimTrailingSlash = (p: string): string =>
  p !== "/" && p.endsWith("/") ? p.slice(0, -1) : p;

const stripLang = (p: string, l: string): string => {
  const parts = p.split("/").filter(Boolean);
  if (parts[0] === l) parts.shift();
  return parts.length ? `/${parts.join("/")}` : "";
};

const normalizeHref = (href: string): string => {
  const [proto, rest] = href.split("://");
  if (!rest) return href;
  return `${proto}://${rest.replace(/\/{2,}/g, "/")}`;
};

/* ------------------------------------------------------------------ */
/* buildLinks – canonical + hreflang                                  */
/* ------------------------------------------------------------------ */
interface BuildLinksArgs {
  lang: string; // caller-provided language (may be invalid)
  origin: string;
  path: string;
}

export function buildLinks({
  lang: declaredLang,
  origin,
  path,
}: BuildLinksArgs): HtmlLinkDescriptor[] {
  const { supportedLngs, fallbackLng } = i18nConfig;
  const supportedList = (Array.isArray(supportedLngs) ? supportedLngs : []) as AppLanguage[];

  /* ── Resolve active language ── */
  const urlLang =
    supportedList.find((l) => l === path.split("/")[1]) ??
    supportedList.find((l) => l === declaredLang) ??
    (fallbackLng as AppLanguage);

  const lang: AppLanguage = urlLang;

  /* ── Canonical link ── */
  const canonicalPath = trimTrailingSlash(path);
  const canonical: HtmlLinkDescriptor = {
    rel: "canonical",
    href: `${origin}${canonicalPath === "/" ? "" : canonicalPath}`,
  };

  /* ── Determine slug context ── */
  const rawSuffix = stripLang(path, lang);
  const segments = rawSuffix.split("/").filter(Boolean);
  const firstSeg = segments[0] ?? "";
  const slugKey: SlugKey | null = slugLookup[lang]?.[firstSeg] ?? null;
  const afterFirst = segments.slice(1).join("/");
  const remainder = afterFirst ? `/${afterFirst}` : "";

  /* Assistance-article mapping (for second segment) */
  let guideKey: GuideKey | null = null;
  // Map assistance article slug → canonical key using precomputed lookup.
  let articleKey: string | null = null;
  if (slugKey === "assistance" && afterFirst) {
    articleKey = assistanceArticleLookup[lang]?.[afterFirst] ?? null;
  }
  if ((slugKey === "guides" || slugKey === "experiences" || slugKey === "howToGetHere") && afterFirst) {
    guideKey = guideLookup[lang]?.[afterFirst] ?? null;
  }

  /* ── hreflang alternates ── */
  const supportedLanguages = (Array.isArray(supportedLngs) ? supportedLngs : ["en"]) as string[];
  const alternates: HtmlLinkDescriptor[] = supportedLanguages
    .filter((lng) => lng !== lang)
    .map((lng) => {
      const targetLang = lng as AppLanguage;
      // Translate the first slug segment into the target language when known
      const translatedFirst = slugKey ? SLUGS[slugKey][targetLang] : firstSeg;
      const translatedRest =
        articleKey !== null
          ? `/${
              ARTICLE_SLUGS_BY_KEY[articleKey]?.[targetLang] ??
              ARTICLE_SLUGS_BY_KEY[articleKey]?.en ??
              ""
            }`
          : guideKey !== null
          ? `/${guideSlug(targetLang, guideKey)}`
          : remainder;

      const suffix =
        translatedFirst || translatedRest
          ? `/${[translatedFirst, translatedRest.replace(/^\//, "")].filter(Boolean).join("/")}`
          : "";

      return {
        rel: "alternate",
        href: normalizeHref(`${origin}/${targetLang}${suffix}`),
        hrefLang: targetLang,
        key: `alt-${targetLang}`,
      };
    });

  /* ── x-default fallback ── */
  const defaultLang: AppLanguage =
    (fallbackLng as AppLanguage | undefined) ??
    ((Array.isArray(supportedLngs) && supportedLngs[0] ? supportedLngs[0] : "en") as AppLanguage);
  const defFirst = slugKey ? SLUGS[slugKey][defaultLang] : firstSeg;
  const defRest =
    articleKey !== null
      ? `/${(ARTICLE_SLUGS_BY_KEY[articleKey]?.[defaultLang] ?? ARTICLE_SLUGS_BY_KEY[articleKey]?.en ?? "")}`
      : guideKey !== null
      ? `/${guideSlug(defaultLang, guideKey)}`
      : remainder;

  alternates.push({
    rel: "alternate",
    href: normalizeHref(
      `${origin}/${defaultLang}${
        defFirst || defRest
          ? `/${[defFirst, defRest.replace(/^\//, "")].filter(Boolean).join("/")}`
          : ""
      }`
    ),
    hrefLang: "x-default",
  });

  return [canonical, ...alternates];
}

/* ------------------------------------------------------------------ */
/* buildBreadcrumb – schema.org JSON-LD                               */
/* ------------------------------------------------------------------ */
interface BreadcrumbArgs {
  lang: string;
  origin: string;
  path: string;
  title: string;
  homeLabel: string;
}

export function buildBreadcrumb({
  lang: declaredLang,
  origin,
  path,
  title,
  homeLabel,
}: BreadcrumbArgs): BreadcrumbList {
  const supported = SUPPORTED_LANGS_SAFE as readonly AppLanguage[];
  const lang =
    (supported.find((l) => l === path.split("/")[1]) as AppLanguage | undefined) ??
    (supported.find((l) => l === declaredLang) as AppLanguage | undefined) ??
    ((i18nConfig.fallbackLng as AppLanguage | undefined) ?? (supported[0] as AppLanguage));

  const items: BreadcrumbList["itemListElement"] = [
    {
      "@type": "ListItem",
      position: 1,
      name: homeLabel,
      item: `${origin}/${lang}`,
    },
  ];

  const trimmed = trimTrailingSlash(path);
  if (trimmed !== `/${lang}`) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: title,
      item: `${origin}${trimmed}`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    inLanguage: lang,
    itemListElement: items,
  };
}

/* ------------------------------------------------------------------ */
/* buildMeta – Open Graph / basic meta                                */
/* ------------------------------------------------------------------ */
interface BuildMetaArgs {
  lang: string;
  title: string;
  description: string;
  url: string;
}

export function buildMeta({
  lang,
  title,
  description,
  url,
}: BuildMetaArgs): Array<
  | { charSet: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { title: string }
> {
  return [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "description", content: description },
    { name: "language", content: lang },
    { title },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: lang },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
  ];
}

/* ------------------------------------------------------------------ */
/* pageHead – unified head tags (title/meta/OG/Twitter)               */
/* ------------------------------------------------------------------ */
export interface PageHeadArgs {
  lang: AppLanguage;
  title: string;
  description: string;
  url?: string;
  image?: { src: string; width?: number | string; height?: number | string; alt?: string };
  twitterCard?: string; // defaults to "summary_large_image"
  includeTwitterUrl?: boolean; // include twitter:url when `url` provided
  ogType?: string; // defaults to "website"
}

export function pageHead({
  lang,
  title,
  description,
  url,
  image,
  twitterCard = "summary_large_image",
  includeTwitterUrl = true,
  ogType = "website",
}: PageHeadArgs): React.ReactNode {
  const nodes: React.ReactNode[] = [];

  // Basic title + description
  nodes.push(React.createElement("title", { key: "title" }, title));
  nodes.push(
    React.createElement("meta", { key: "desc", name: "description", content: description })
  );

  // Open Graph core
  nodes.push(React.createElement("meta", { key: "og:title", property: "og:title", content: title }));
  nodes.push(
    React.createElement("meta", { key: "og:description", property: "og:description", content: description })
  );
  nodes.push(
    React.createElement("meta", { key: "og:locale", property: "og:locale", content: lang })
  );
  nodes.push(
    React.createElement("meta", { key: "og:type", property: "og:type", content: ogType })
  );
  if (url) nodes.push(React.createElement("meta", { key: "og:url", property: "og:url", content: url }));

  // OG image block
  if (image?.src) {
    nodes.push(
      React.createElement("meta", { key: "og:image", property: "og:image", content: image.src })
    );
    if (image.width)
      nodes.push(
        React.createElement("meta", {
          key: "og:image:width",
          property: "og:image:width",
          content: String(image.width),
        })
      );
    if (image.height)
      nodes.push(
        React.createElement("meta", {
          key: "og:image:height",
          property: "og:image:height",
          content: String(image.height),
        })
      );
    if (image.alt)
      nodes.push(
        React.createElement("meta", {
          key: "og:image:alt",
          property: "og:image:alt",
          content: image.alt,
        })
      );
  }

  // Twitter card parity
  nodes.push(
    React.createElement("meta", {
      key: "twitter:card",
      name: "twitter:card",
      content: twitterCard,
    })
  );
  if (image?.src)
    nodes.push(
      React.createElement("meta", { key: "twitter:image", name: "twitter:image", content: image.src })
    );
  nodes.push(
    React.createElement("meta", { key: "twitter:title", name: "twitter:title", content: title })
  );
  nodes.push(
    React.createElement("meta", {
      key: "twitter:description",
      name: "twitter:description",
      content: description,
    })
  );
  if (url && includeTwitterUrl)
    nodes.push(
      React.createElement("meta", { key: "twitter:url", name: "twitter:url", content: url })
    );

  // OG locale alternates for other supported languages
  nodes.push(
    ...SUPPORTED_LANGS_SAFE.filter((l) => l !== lang).map((l) =>
      React.createElement("meta", {
        key: `og:locale:alt:${l}`,
        property: "og:locale:alternate",
        content: l,
      }),
    )
  );

  return React.createElement(React.Fragment, null, ...nodes);
}
