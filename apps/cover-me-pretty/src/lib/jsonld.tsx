import React from "react";

export function JsonLdScript({ data }: { data: unknown }) {
  const json = JSON.stringify(data);
  return (
    <script
      /* i18n-exempt -- ABC-123 MIME type constant, not user-facing copy [ttl=2025-06-30] */
      type="application/ld+json"
      
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export function organizationJsonLd({
  name,
  logo,
  url,
}: {
  name: string;
  logo?: string;
  url?: string;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
  };
  if (logo) data.logo = logo;
  if (url) data.url = url;
  return data;
}

export function productJsonLd({
  name,
  description,
  image,
  brand,
  sku,
  url,
  price,
  priceCurrency,
  availability,
  aggregateRating,
}: {
  name: string;
  description?: string;
  image?: string;
  brand?: string;
  sku?: string;
  url?: string;
  price?: number;
  priceCurrency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  aggregateRating?: { ratingValue: number; reviewCount: number };
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
  };
  if (description) data.description = description;
  if (image) data.image = image;
  if (brand) data.brand = { "@type": "Brand", name: brand };
  if (sku) data.sku = sku;
  if (url) data.url = url;
  if (price && priceCurrency) {
    data.offers = {
      "@type": "Offer",
      price: (price / 100).toFixed(2),
      priceCurrency,
      availability: availability
        ? `https://schema.org/${availability}`
        : undefined,
    };
  }
  if (aggregateRating) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
    };
  }
  return data;
}

export function articleJsonLd({
  headline,
  description,
  datePublished,
  author,
  image,
  url,
}: {
  headline: string;
  description?: string;
  datePublished?: string;
  author?: string;
  image?: string;
  url?: string;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
  };
  if (description) data.description = description;
  if (datePublished) data.datePublished = datePublished;
  if (author) data.author = { "@type": "Person", name: author };
  if (image) data.image = image;
  if (url) data.url = url;
  return data;
}

function toIsoDate(input?: string) {
  if (!input) return undefined;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function blogItemListJsonLd({
  url,
  items,
}: {
  url?: string;
  items: Array<{ title: string; url: string; date?: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url,
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: it.url,
      item: {
        "@type": "BlogPosting",
        headline: it.title,
        url: it.url,
        ...(toIsoDate(it.date) ? { datePublished: toIsoDate(it.date) } : {}),
      },
    })),
  } as const;
}
