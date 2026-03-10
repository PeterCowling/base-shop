
// /src/utils/seo.ts
/* ────────────────────────────────────────────────────────────────
   SEO helpers – canonical, hreflang, breadcrumb, meta
   Handles one-level slugs and nested guide slugs (including assistance guides).
   ---------------------------------------------------------------- */

import React from "react";

import { ensureTrailingSlash } from "@acme/seo/metadata";
import {
  findPrivateRoomChildRouteIdBySlug,
  getPrivateRoomChildSlug,
  type PrivateRoomChildRouteId,
} from "@acme/ui/config/privateRoomChildSlugs";

import { GUIDE_SLUG_LOOKUP_BY_LANG,type GuideKey, guideNamespace,guideSlug } from "@/guides/slugs";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { SLUGS } from "@/slug-map";
import type { SlugKey, SlugMap } from "@/types/slugs";
import { getPublicBuildLanguages } from "@/utils/buildLanguages";
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
// Guide lookup includes assistance guides via slug parity (GUIDE_SLUG_OVERRIDES)
const guideLookup: Record<AppLanguage, Record<string, GuideKey>> =
  GUIDE_SLUG_LOOKUP_BY_LANG as unknown as Record<AppLanguage, Record<string, GuideKey>>;

const slugs: SlugMap = SLUGS;
(Object.keys(slugs) as SlugKey[]).forEach((key) => {
  (Object.keys(slugs[key]) as AppLanguage[]).forEach((lng) => {
    slugLookup[lng] ??= {};
    slugLookup[lng][slugs[key][lng]] = key;
  });
});

// Resolve a safe list of languages (tests may partially mock i18nConfig)
const SUPPORTED_LANGS_SAFE: readonly AppLanguage[] = (() => {
  const arr = getPublicBuildLanguages();
  return (arr.length > 0 ? arr : ["en"]) as readonly AppLanguage[];
})();

/* ------------------------------------------------------------------ */
/* Helper utilities                                                   */
/* ------------------------------------------------------------------ */
// Re-exported from @acme/seo — canonical implementation lives in the shared package.
// Also used locally in this file (e.g., buildLinks canonical path).
export { ensureTrailingSlash };

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

const toSlashlessPath = (value: string): string => {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  if (withLeadingSlash === "/") return withLeadingSlash;
  const trimmed = withLeadingSlash.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

/* ------------------------------------------------------------------ */
/* buildLinks – canonical + hreflang                                  */
/* ------------------------------------------------------------------ */
interface BuildLinksArgs {
  lang: string; // caller-provided language (may be invalid)
  origin: string;
  path: string;
}

type RouteContext = {
  firstSeg: string;
  slugKey: SlugKey | null;
  guideKey: GuideKey | null;
  privateRoomChildRouteId: PrivateRoomChildRouteId | null;
  remainder: string;
};

function resolveGuideKey(
  lang: AppLanguage,
  slugKey: SlugKey | null,
  afterFirst: string
): GuideKey | null {
  if (!afterFirst) return null;
  if (
    slugKey !== "assistance" &&
    slugKey !== "guides" &&
    slugKey !== "experiences" &&
    slugKey !== "howToGetHere"
  ) {
    return null;
  }
  return guideLookup[lang]?.[afterFirst] ?? null;
}

function buildLocalizedSuffix(targetLang: AppLanguage, context: RouteContext): string {
  const translatedFirst = context.guideKey
    ? guideNamespace(targetLang, context.guideKey).baseSlug
    : context.slugKey
    ? SLUGS[context.slugKey][targetLang]
    : context.firstSeg;
  const translatedRest = context.guideKey
    ? `/${guideSlug(targetLang, context.guideKey)}`
    : context.privateRoomChildRouteId
    ? `/${getPrivateRoomChildSlug(context.privateRoomChildRouteId, targetLang)}`
    : context.remainder;

  if (!translatedFirst && !translatedRest) return "";
  return `/${[translatedFirst, translatedRest.replace(/^\//, "")].filter(Boolean).join("/")}`;
}

export function buildLinks({
  lang: declaredLang,
  origin,
  path,
}: BuildLinksArgs): HtmlLinkDescriptor[] {
  const supportedList = getPublicBuildLanguages();
  const fallbackLang =
    supportedList.find((candidate) => candidate === i18nConfig.fallbackLng) ??
    supportedList[0] ??
    "en";

  /* ── Resolve active language ── */
  const urlLang =
    supportedList.find((l) => l === path.split("/")[1]) ??
    supportedList.find((l) => l === declaredLang) ??
    fallbackLang;

  const lang: AppLanguage = urlLang;

  /* ── Canonical link ── */
  const canonicalPath = toSlashlessPath(path);
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
  // Assistance guides are now in guideLookup via slug parity (GUIDE_SLUG_OVERRIDES)
  const guideKey = resolveGuideKey(lang, slugKey, afterFirst);
  const privateRoomChildRouteId =
    slugKey === "apartment" && segments.length === 2
      ? (findPrivateRoomChildRouteIdBySlug(segments[1] ?? "", lang) ?? null)
      : null;
  const routeContext: RouteContext = {
    firstSeg,
    slugKey,
    guideKey,
    privateRoomChildRouteId,
    remainder,
  };

  /* ── hreflang alternates ── */
  const alternates: HtmlLinkDescriptor[] = supportedList
    .map((lng) => {
      const suffix = buildLocalizedSuffix(lng, routeContext);

      return {
        rel: "alternate",
        href: normalizeHref(`${origin}/${lng}${suffix}`),
        hrefLang: lng,
        key: `alt-${lng}`,
      };
    });

  /* ── x-default fallback ── */
  const defaultSuffix = buildLocalizedSuffix(fallbackLang, routeContext);

  alternates.push({
    rel: "alternate",
    href: normalizeHref(`${origin}/${fallbackLang}${defaultSuffix}`),
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

  const normalized = toSlashlessPath(path);
  if (normalized !== "/" && normalized !== `/${lang}`) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: title,
      item: `${origin}${normalized}`,
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
