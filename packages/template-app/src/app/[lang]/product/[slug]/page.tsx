// packages/template-app/src/app/[lang]/product/[slug]/page.tsx

import { LOCALES, type Locale } from "@acme/i18n";
import { getProductBySlug } from "@platform-core/products";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PdpClient from "./PdpClient.client";
import { getStructuredData, serializeJsonLd } from "../../../../lib/seo";
import { CleaningInfo } from "../../../../components/CleaningInfo";
import shop from "../../../../../shop.json";

export async function generateStaticParams() {
  return LOCALES.flatMap((lang: Locale) =>
    ["green-sneaker", "sand-sneaker", "black-sneaker"].map((slug) => ({
      lang,
      slug,
    }))
  );
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  return {
    title: product
      ? `${product.title} · Base-Shop` // i18n-exempt: brand name in SEO title
      : "Product not found", // i18n-exempt: generic SEO fallback
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return notFound();
  const jsonLd = getStructuredData({
    type: "Product",
    name: product.title,
    description: product.description,
    url: `/${lang}/product/${slug}`,
    image: product.media[0]?.url,
    offers: { price: product.price, priceCurrency: "USD" },
  });

  /* ⬇️  Only data, no event handlers */
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PdpClient product={product} />
      {shop.showCleaningTransparency && <CleaningInfo />}
    </>
  );
}
