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
  /** Price in minor units (cents). Converted to decimal for Schema.org. */
  price?: number;
  priceCurrency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  aggregateRating?: { ratingValue: number; reviewCount: number };
}): Record<string, unknown> {
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
  if (price != null && priceCurrency) {
    data.offers = {
      "@type": "Offer",
      price: (price / 100).toFixed(2),
      priceCurrency,
      ...(availability
        ? { availability: `https://schema.org/${availability}` }
        : {}),
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
