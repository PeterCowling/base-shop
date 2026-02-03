// src/utils/routeHead.ts
// Local type definitions (no longer using react-router types)
import { PUBLIC_BASE_URL } from "@/config/env";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";
import { getOrigin } from "@/utils/env-helpers";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
// Use a namespace import so partial vi.mocks that only export a subset
// of the SEO helpers (e.g. pageHead) don't throw at import time.
import * as seo from "@/utils/seo";
import { getSlug } from "@/utils/slug";

type MetaDescriptor = Record<string, string>;
type LinkDescriptor = { rel: string; href: string; hrefLang?: string };
type MetaFunction = () => MetaDescriptor[];
type LinksFunction = () => LinkDescriptor[];

const FALLBACK_CANONICAL_ORIGIN = "https://hostel-positano.com";

const ensureAbsoluteOrigin = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const prefixed = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
  try {
    return new URL(prefixed).origin;
  } catch {
    return undefined;
  }
};

const CANONICAL_ORIGIN = ensureAbsoluteOrigin(PUBLIC_BASE_URL) ?? FALLBACK_CANONICAL_ORIGIN;

type OgImage = { src: string; width?: number | string; height?: number | string; alt?: string };

type RouteLinkContext = {
  lang?: AppLanguage;
  path?: string;
  url?: string;
  origin?: string;
};

const routeLinkContextStack: RouteLinkContext[] = [];
let lastRouteLinkContext: RouteLinkContext | undefined;

const pushRouteLinkContext = (context: RouteLinkContext) => {
  routeLinkContextStack.push(context);
  lastRouteLinkContext = context;
};

export type RouteHeadArgs = {
  lang: AppLanguage;
  title: string;
  description: string;
  /** Absolute URL for og:url and twitter:url */
  url: string;
  /** Canonical pathname beginning with "/" (used for hreflang cluster) */
  path?: string;
  /** OG image block (1200x630 recommended) */
  image?: OgImage;
  /** Defaults to "website"; use "article" for guides/how‑tos */
  ogType?: string;
  /** Optional override for twitter:card (e.g., "summary"). Defaults to summary_large_image. */
  twitterCard?: string;
  /** Include twitter:url; defaults true */
  includeTwitterUrl?: boolean;
  /** When false, emit robots noindex,follow */
  isPublished?: boolean;
};

export function buildRouteMeta({
  lang,
  title,
  description,
  url,
  path,
  image,
  ogType = "website",
  twitterCard,
  includeTwitterUrl = true,
  isPublished = true,
}: RouteHeadArgs): ReturnType<MetaFunction> {
  const tags: Array<Record<string, string>> = [];
  tags.push({ title });
  tags.push({ name: "description", content: description });
  tags.push({ property: "og:type", content: ogType });
  tags.push({ property: "og:locale", content: String(lang) });
  tags.push({ property: "og:title", content: title });
  tags.push({ property: "og:description", content: description });
  tags.push({ property: "og:url", content: url });
  if (image?.src) {
    tags.push({ property: "og:image", content: image.src });
    const width = image.width ?? DEFAULT_OG_IMAGE.width;
    const height = image.height ?? DEFAULT_OG_IMAGE.height;
    if (width) tags.push({ property: "og:image:width", content: String(width) });
    if (height) tags.push({ property: "og:image:height", content: String(height) });
    if (image.alt) tags.push({ property: "og:image:alt", content: image.alt });
  }
  tags.push({ name: "twitter:card", content: (twitterCard && String(twitterCard).trim()) || "summary_large_image" });
  if (image?.src) tags.push({ name: "twitter:image", content: image.src });
  tags.push({ name: "twitter:title", content: title });
  tags.push({ name: "twitter:description", content: description });
  if (includeTwitterUrl) tags.push({ name: "twitter:url", content: url });
  // For non-published pages, we prefer allowing crawlers to follow links
  // (useful for discovery of related content) while preventing indexing.
  if (!isPublished) {
    tags.push({
      name: "robots",
      content: /* i18n-exempt -- ABC-123 [ttl=2026-12-31] robots directive */ "noindex,follow",
    });
  }
  const supported = (i18nConfig.supportedLngs as readonly AppLanguage[] | undefined) ?? [];
  supported
    .filter((l): l is AppLanguage => l !== lang)
    .forEach((l) => tags.push({ property: "og:locale:alternate", content: l }));

  if (path) {
    let origin: string | undefined;
    try {
      origin = new URL(url).origin;
    } catch {
      origin = undefined;
    }
    const resolvedOrigin = origin || getOrigin();
    try {
      const linkDescriptors = seo.buildLinks({
        lang,
        origin: resolvedOrigin,
        path,
      });

      linkDescriptors.forEach((descriptor) => {
        tags.push({
          tagName: "link",
          ...descriptor,
        });
      });
    } catch {
      // If buildLinks throws (e.g., during partial mocks), fall back to canonical only.
      const canonicalPath = path === "/" || path.endsWith("/") ? path : `${path}/`;
      tags.push({
        tagName: "link",
        rel: "canonical",
        href: `${resolvedOrigin}${canonicalPath === "/" ? "" : canonicalPath}`,
      });
    }
  }

  const context: RouteLinkContext = {
    lang,
    ...(path ? { path } : {}),
    ...(url ? { url } : {}),
  };
  pushRouteLinkContext(context);

  return tags as unknown as ReturnType<MetaFunction>;
}

type BuildRouteLinksArgs = {
  lang?: AppLanguage;
  path?: string;
  url?: string;
  origin?: string;
};

export function buildRouteLinks(args?: BuildRouteLinksArgs): ReturnType<LinksFunction> {
  const contextSource = args ?? routeLinkContextStack.pop() ?? lastRouteLinkContext;
  if (!contextSource) return [];

  const resolvedOrigin = (() => {
    if (contextSource.origin) return contextSource.origin;
    if (contextSource.url) {
      try {
        return new URL(contextSource.url).origin;
      } catch {
        // ignore invalid url and fall back
      }
    }
    return CANONICAL_ORIGIN;
  })();

  const resolvedPath = (() => {
    if (contextSource.path && contextSource.path.trim().length > 0) {
      return contextSource.path.startsWith("/") ? contextSource.path : `/${contextSource.path}`;
    }
    if (contextSource.url) {
      try {
        const parsed = new URL(contextSource.url);
        return parsed.pathname || "/";
      } catch {
        /* noop */
      }
    }
    const fallbackLang = (contextSource.lang as string | undefined) ?? (i18nConfig.fallbackLng as string | undefined) ?? "en";
    return `/${fallbackLang}`;
  })();

  const resolvedLang = (() => {
    if (contextSource.lang) return contextSource.lang;
    const seg = resolvedPath.split("/").filter(Boolean)[0];
    if (seg && (i18nConfig.supportedLngs as readonly string[] | undefined)?.includes(seg)) {
      return seg as AppLanguage;
    }
    const fallbackConfig = i18nConfig.fallbackLng as unknown;
    if (typeof fallbackConfig === "string") {
      return fallbackConfig as AppLanguage;
    }
    if (Array.isArray(fallbackConfig)) {
      const fallbackList = fallbackConfig as ReadonlyArray<unknown>;
      const firstFallback = fallbackList.find(
        (value): value is string => typeof value === "string" && value.length > 0,
      );
      if (firstFallback) {
        return firstFallback as AppLanguage;
      }
    }
    if (fallbackConfig && typeof fallbackConfig === "object") {
      const maybeValues = Object.values(fallbackConfig as Record<string, unknown>);
      for (const candidate of maybeValues) {
        if (typeof candidate === "string" && candidate.length > 0) {
          return candidate as AppLanguage;
        }
        if (Array.isArray(candidate)) {
          const match = (candidate as ReadonlyArray<unknown>).find(
            (value): value is string => typeof value === "string" && value.length > 0,
          );
          if (match) {
            return match as AppLanguage;
          }
        }
      }
    }
    return "en" as AppLanguage;
  })();

  lastRouteLinkContext = {
    lang: resolvedLang,
    path: resolvedPath,
    origin: resolvedOrigin,
    ...(contextSource.url ? { url: contextSource.url } : {}),
  };

  try {
    return seo.buildLinks({
      lang: resolvedLang,
      origin: resolvedOrigin,
      path: resolvedPath,
    });
  } catch {
    const canonicalPath = resolvedPath !== "/" && resolvedPath.endsWith("/") ? resolvedPath.slice(0, -1) : resolvedPath;
    return [
      {
        rel: "canonical",
        href: `${resolvedOrigin}${canonicalPath === "/" ? "" : canonicalPath}`,
      },
      {
        rel: "alternate",
        href: `${resolvedOrigin}${canonicalPath === "/" ? "" : canonicalPath}`,
        hrefLang: "x-default",
      },
    ];
  }
}

// Convenience helpers for common site pages with known slugs
export function buildRoomsHead(lang: AppLanguage, title: string, description: string) {
  const path = `/${lang}/${getSlug("rooms", lang)}`;
  return {
    meta: buildRouteMeta({
      lang,
      title,
      description,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: buildCfImageUrl("/img/og-rooms.jpg", { width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height, quality: 85, format: "auto" }) },
    }),
    links: buildRouteLinks(),
  } as const;
}
