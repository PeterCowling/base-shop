// apps/shop-abc/src/app/[lang]/product/[slug]/page.tsx
import { getProductBySlug } from "@/lib/products";
import { Locale, resolveLocale } from "@/i18n/locales";
import { LOCALES } from "@acme/i18n";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPages } from "@platform-core/repositories/pages/index.server";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import shop from "../../../../../shop.json";
import type { PageComponent } from "@types";
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

async function loadComponents(slug: string): Promise<PageComponent[] | null> {
  const pages = await getPages(shop.id);
  const page = pages.find(
    (p) => p.slug === `product/${slug}` && p.status === "published"
  );
  return page?.components ?? null;
}

export default async function ProductDetailPage({
  params,
}: {
  params: { lang: string; slug: string };
}) {
  const lang: Locale = resolveLocale(params.lang);
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();

  const components = await loadComponents(params.slug);
  if (components && components.length) {
    return (
      <DynamicRenderer
        components={components}
        data={{ locale: lang, product }}
      />
    );
  }

  // Fallback to default product detail page
  return <PdpClient product={product} />;
}
