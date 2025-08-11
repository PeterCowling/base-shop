import { LOCALES, type Locale } from "@i18n/locales";
import type { ShopSettings } from "@acme/types";
import type { NextSeoProps } from "next-seo";
import { env } from "@acme/config";

interface ExtendedSeoProps extends Partial<NextSeoProps> {
  canonicalBase?: string;
}

const fallback: NextSeoProps = {
  title: "",
  description: "",
  canonical: "",
  openGraph: {},
  twitter: {},
};

export async function getSeo(
  locale: Locale,
  pageSeo: Partial<NextSeoProps> = {},
): Promise<NextSeoProps> {
  const shop = env.NEXT_PUBLIC_SHOP_ID || "default";
  const { getShopSettings } = await import(
    "@platform-core/repositories/shops.server"
  );
  const settings: ShopSettings = await getShopSettings(shop);
  const shopSeo = (settings.seo ?? {}) as Record<string, ExtendedSeoProps>;
  const base: ExtendedSeoProps = shopSeo[locale] ?? {};
  const canonicalBase = base.canonicalBase ?? "";

  const canonicalOverride = pageSeo.canonical ?? base.canonical;
  let canonicalPath = "";
  if (canonicalOverride) {
    try {
      canonicalPath = new URL(canonicalOverride).pathname.replace(
        new RegExp(`^/${locale}`),
        "",
      );
    } catch {
      canonicalPath = "";
    }
  }

  const perLocaleCanonical: Partial<Record<Locale, string>> = {};
  for (const l of LOCALES) {
    const cBase = shopSeo[l]?.canonicalBase;
    if (cBase) {
      perLocaleCanonical[l] = `${cBase}/${l}${canonicalPath}`;
    }
  }
  const alternates = Object.entries(perLocaleCanonical).map(([l, href]) => ({
    rel: "alternate" as const,
    hrefLang: l,
    href,
  }));

  const imagePath =
    pageSeo.openGraph?.images?.[0]?.url ||
    (pageSeo.openGraph as any)?.image ||
    pageSeo.image ||
    base.openGraph?.images?.[0]?.url ||
    (base.openGraph as any)?.image ||
    base.image;
  const resolvedImage =
    imagePath && !/^https?:/i.test(imagePath)
      ? `${canonicalBase}${imagePath}`
      : imagePath;

  const canonical =
    canonicalOverride ??
    perLocaleCanonical[locale] ??
    (canonicalBase ? `${canonicalBase}/${locale}` : fallback.canonical);

  return {
    title: pageSeo.title ?? base.title ?? fallback.title,
    description:
      pageSeo.description ?? base.description ?? fallback.description,
    canonical,
    openGraph: {
      ...(fallback.openGraph ?? {}),
      ...(base.openGraph ?? {}),
      ...(pageSeo.openGraph ?? {}),
      url:
        pageSeo.openGraph?.url ??
        base.openGraph?.url ??
        perLocaleCanonical[locale] ??
        (canonicalBase ? `${canonicalBase}/${locale}` : undefined),
      images: resolvedImage ? [{ url: resolvedImage }] : undefined,
    },
    twitter: {
      ...(fallback.twitter ?? {}),
      ...(base.twitter ?? {}),
      ...(pageSeo.twitter ?? {}),
    },
    additionalLinkTags: alternates,
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

