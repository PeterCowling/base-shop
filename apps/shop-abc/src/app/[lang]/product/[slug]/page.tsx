// apps/shop-abc/src/app/[lang]/[lang]/product/[slug]/page.tsx
import { getProductBySlug } from "@/lib/products";
import { LOCALES } from "@acme/i18n";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPages } from "@platform-core/repositories/pages/index.server";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { Locale, resolveLocale } from "@/i18n/locales";
import shop from "../../../../../shop.json";
import PdpClient from "./PdpClient.client";

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

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; lang?: string }>;
}) {
  const { slug, lang: rawLang } = await params;
  const product = getProductBySlug(slug);
  if (!product) return notFound();

  const locale: Locale = resolveLocale(rawLang);
  const pages = await getPages(shop.id);
  const components =
    pages.find((p) => p.slug === `product/${slug}`)?.components ?? [];

  if (!components.length) {
    return <PdpClient product={product} />;
  }

  return (
    <DynamicRenderer
      components={components}
      locale={locale}
      runtimeData={{ product }}
    />
  );
}
