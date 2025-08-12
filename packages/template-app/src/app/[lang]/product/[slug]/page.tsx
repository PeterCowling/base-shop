// packages/template-app/src/app/[lang]/product/[slug]/page.tsx

import { LOCALES } from "@acme/i18n";
import { getProductBySlug } from "@platform-core/src/products";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PdpClient from "./PdpClient.client";
import { getStructuredData } from "../../../../lib/seo";

export async function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    ["green-sneaker", "sand-sneaker", "black-sneaker"].map((slug) => ({
      lang,
      slug,
    }))
  );
}

export const revalidate = 60;

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const product = getProductBySlug(params.slug);
  return {
    title: product ? `${product.title} · Base-Shop` : "Product not found",
  };
}

export default function ProductDetailPage({
  params,
}: {
  params: { lang: string; slug: string };
}) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();
  const jsonLd = getStructuredData({
    type: "Product",
    name: product.title,
    description: product.description,
    url: `/${params.lang}/product/${params.slug}`,
    image: product.media[0]?.url,
    offers: { price: product.price, priceCurrency: "USD" },
  });

  /* ⬇️  Only data, no event handlers */
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PdpClient product={product} />
    </>
  );
}
