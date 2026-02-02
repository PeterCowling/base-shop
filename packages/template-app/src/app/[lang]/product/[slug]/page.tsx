// packages/template-app/src/app/[lang]/product/[slug]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { type Locale, LOCALES, resolveLocale } from "@acme/i18n/locales";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { getProductBySlug } from "@acme/platform-core/products";

import shop from "../../../../../shop.json";
import { CleaningInfo } from "../../../../components/CleaningInfo";
import { getStructuredData, serializeJsonLd } from "../../../../lib/seo";

import PdpClient from "./PdpClient.client";

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
  params: Promise<{ lang?: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, lang } = await params;
  const product = getProductBySlug(slug);
  const t = await getServerTranslations(resolveLocale(lang));
  return {
    title: product
      ? `${product.title} · ${t("brand.name")}`
      : t("product.notFound"),
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
    type: "Product", /* i18n-exempt -- DX-1023 [ttl=2026-12-31] schema.org type constant */
    name: product.title,
    description: product.description,
    url: `/${lang}/product/${slug}`,
    image: product.media[0]?.url,
    offers: { price: product.price, priceCurrency: "USD" /* i18n-exempt -- DX-1023 [ttl=2026-12-31] ISO currency code in structured data */ },
  });

  /* ⬇️  Only data, no event handlers */
  return (
    <>
      {/* i18n-exempt -- DX-1023 [ttl=2026-12-31] non-visual JSON-LD script */}
      <script
        type="application/ld+json" /* i18n-exempt -- DX-1023 [ttl=2026-12-31] MIME type constant, not user-facing copy */
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PdpClient product={product} />
      {shop.showCleaningTransparency && <CleaningInfo />}
    </>
  );
}
