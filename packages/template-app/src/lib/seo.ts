import type { NextSeoProps } from "next-seo";

import { coreEnv } from "@acme/config/env/core";
import { type Locale,LOCALES } from "@acme/i18n/locales";
import type { ShopSettings } from "@acme/types";
import { serializeJsonLd } from "@acme/ui/lib/seo/serializeJsonLd";

/** Minimal representation of a link tag for Next SEO */
type LinkTag = {
  rel: string;
  href: string;
  hrefLang?: string;
};

interface OpenGraphImageProps {
  image?: string;
}

interface ExtendedSeoProps
  extends Omit<Partial<NextSeoProps>, "openGraph"> {
  canonicalBase?: string;
  image?: string;
  openGraph?: OpenGraphImageProps & NextSeoProps["openGraph"];
}

export type SeoResult = NextSeoProps & {
  structuredData?: Record<string, unknown> | unknown[];
  languages: Locale[];
  canonicalBase?: string;
};

const fallback: NextSeoProps = {
  title: "",
  description: "",
  canonical: "",
  openGraph: {},
  twitter: {},
};

const FALLBACK_LANGUAGES = LOCALES as readonly Locale[];

const safeAbsoluteUrl = (value?: string): string => {
  if (!value) return "";
  try {
    const url = new URL(value);
    const cleanedPath = url.pathname.replace(/\/$/, "");
    return `${url.origin}${cleanedPath}`;
  } catch {
    return "";
  }
};

const normalizePath = (value?: string): string => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).pathname || "";
    } catch {
      return "";
    }
  }
  return value.startsWith("/") ? value : "";
};

const parseStructuredData = (
  value?: string,
): Record<string, unknown> | unknown[] | undefined => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
};

export async function getSeo(
  locale: Locale,
  pageSeo: Partial<ExtendedSeoProps> = {}
): Promise<SeoResult> {
  const shop =
    ((coreEnv as { NEXT_PUBLIC_SHOP_ID?: string }).NEXT_PUBLIC_SHOP_ID as
      | string
      | undefined) || "default";
  const { getShopSettings } = await import(
    "@acme/platform-core/repositories/shops.server" // i18n-exempt -- ABC-123 [ttl=2025-12-31] module specifier, not user-facing copy
  );
  const settings: ShopSettings = await getShopSettings(shop);
  const languages =
    (Array.isArray(settings.languages) && settings.languages.length
      ? settings.languages
      : FALLBACK_LANGUAGES) as Locale[];
  const shopSeo = (settings.seo ?? {}) as Record<string, ExtendedSeoProps>;
  const fallbackSeo = shopSeo[languages[0]] ?? {};
  const base: ExtendedSeoProps = shopSeo[locale] ?? {};
  const canonicalBase = safeAbsoluteUrl(base.canonicalBase ?? fallbackSeo.canonicalBase);

  const canonicalRaw = pageSeo.canonical ?? "";
  const canonicalPath = normalizePath(canonicalRaw).replace(
    // eslint-disable-next-line security/detect-non-literal-regexp -- SEO-3202 locale is bounded to known set
    new RegExp(`^/${locale}(?=/|$)`),
    "",
  );
  const canonicalAbsolute =
    canonicalRaw && /^https?:\/\//i.test(canonicalRaw)
      ? (() => {
          try {
            return new URL(canonicalRaw).toString();
          } catch {
            return "";
          }
        })()
      : "";

  const perLocaleCanonical: Partial<Record<Locale, string>> = {};
  for (const l of languages) {
    const cBase = safeAbsoluteUrl(shopSeo[l]?.canonicalBase ?? canonicalBase);
    if (cBase) {
      const targetPath = canonicalPath || `/${l}`;
      perLocaleCanonical[l] = new URL(targetPath, cBase).toString();
    }
  }
  const alternates: LinkTag[] = Object.entries(perLocaleCanonical).flatMap(
    ([l, href]) => (href ? [{ rel: "alternate", hrefLang: l, href }] : [])
  );

  const imagePath =
    pageSeo.openGraph?.images?.[0]?.url ||
    pageSeo.openGraph?.image ||
    pageSeo.image ||
    base.openGraph?.images?.[0]?.url ||
    base.openGraph?.image ||
    base.image;
  const resolvedImage =
    imagePath && canonicalBase && !/^https?:/i.test(imagePath)
      ? new URL(imagePath, canonicalBase).toString()
      : imagePath;

  const canonical =
    perLocaleCanonical[locale] ??
    (canonicalBase
      ? new URL(canonicalPath || `/${locale}`, canonicalBase).toString()
      : canonicalAbsolute || canonicalPath || fallback.canonical);

  const structuredData = parseStructuredData(
    (pageSeo as { structuredData?: string })?.structuredData ??
      (base as { structuredData?: string })?.structuredData ??
      (fallbackSeo as { structuredData?: string })?.structuredData,
  );

  return {
    title: pageSeo.title ?? base.title ?? fallbackSeo.title ?? fallback.title,
    description:
      pageSeo.description ??
      base.description ??
      fallbackSeo.description ??
      fallback.description,
    canonical,
    openGraph: {
      ...(fallback.openGraph ?? {}),
      ...(base.openGraph ?? {}),
      ...(pageSeo.openGraph ?? {}),
      url: pageSeo.openGraph?.url ?? base.openGraph?.url ?? canonical ?? undefined,
      images: resolvedImage ? [{ url: resolvedImage }] : undefined,
    },
    twitter: {
      ...(fallback.twitter ?? {}),
      ...(base.twitter ?? {}),
      ...(pageSeo.twitter ?? {}),
    },
    additionalLinkTags: alternates,
    structuredData,
    languages,
    canonicalBase,
  };
}

/* -------------------------------------------------------------------------- */
/*  Structured data helpers                                                   */
/* -------------------------------------------------------------------------- */

type OfferInput = {
  price: number | string;
  priceCurrency: string;
  availability?: string;
  url?: string;
};

type AggregateRatingInput = {
  ratingValue: number | string;
  reviewCount: number | string;
};

type ProductInput = {
  type: "Product";
  name: string;
  description?: string;
  url?: string;
  image?: string | string[];
  brand?: string;
  offers?: OfferInput;
  aggregateRating?: AggregateRatingInput;
};

type WebPageInput = {
  type: "WebPage";
  name: string;
  description?: string;
  url?: string;
};

export type StructuredDataInput = ProductInput | WebPageInput;

/**
 * Build a JSON-LD object for the given input. Consumers can stringify the
 * result and embed it in a `<script type="application/ld+json">` tag.
 */
export function getStructuredData(input: StructuredDataInput) {
  if (input.type === "Product") {
    const { name, description, url, image, brand, offers, aggregateRating } =
      input;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      ...(description ? { description } : {}),
      ...(url ? { url } : {}),
      ...(image ? { image: Array.isArray(image) ? image : [image] } : {}),
      ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
      ...(offers
        ? {
            offers: {
              "@type": "Offer",
              price: offers.price,
              priceCurrency: offers.priceCurrency,
              ...(offers.availability
                ? { availability: offers.availability }
                : {}),
              ...(offers.url ? { url: offers.url } : {}),
            },
          }
        : {}),
      ...(aggregateRating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: aggregateRating.ratingValue,
              reviewCount: aggregateRating.reviewCount,
            },
          }
        : {}),
    } as Record<string, unknown>;
  }

  const { name, description, url } = input;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    ...(description ? { description } : {}),
    ...(url ? { url } : {}),
  } as Record<string, unknown>;
}

export { serializeJsonLd };
