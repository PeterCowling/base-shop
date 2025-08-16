// apps/shop-bcd/src/app/[lang]/product/[slug]/page.tsx

import { LOCALES } from "@acme/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import { getPublishedPosts } from "@acme/blog";
import shop from "../../../../../shop.json";
import PdpClient from "./PdpClient.client";
import { readRepo } from "@platform-core/repositories/json.server";
import type { SKU, ProductPublication, Locale } from "@acme/types";
import { getReturnLogistics } from "@platform-core/returnLogistics";

async function getProduct(
  slug: string,
  lang: Locale,
  preview: boolean
): Promise<SKU | null> {
  const catalogue = await readRepo<ProductPublication>(shop.id);
  const record = catalogue.find((p) => p.sku === slug || p.id === slug);
  if (!record) return null;
  if (!preview && record.status !== "active") return null;
  const title =
    record.title[lang] ?? record.title.en ?? Object.values(record.title)[0] ?? "";
  const description =
    record.description[lang] ??
    record.description.en ??
    Object.values(record.description)[0] ??
    "";
  return {
    id: record.id,
    slug: record.sku ?? record.id,
    title,
    price: record.price,
    deposit: record.deposit ?? 0,
    stock: 0,
    forSale: record.forSale ?? true,
    forRental: record.forRental ?? false,
    dailyRate: record.dailyRate,
    weeklyRate: record.weeklyRate,
    monthlyRate: record.monthlyRate,
    availability: record.availability ?? [],
    media: record.media ?? [],
    sizes: [],
    description,
  };
}

export async function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
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
  params: { slug: string; lang: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug, params.lang as Locale, false);
  return {
    title: product ? `${product.title} · Base-Shop` : "Product not found",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string; lang: string };
}) {
  const { isEnabled } = draftMode();
  const product = await getProduct(
    params.slug,
    params.lang as Locale,
    isEnabled
  );
  if (!product) return notFound();

  let latestPost: BlogPost | undefined;
  if (shop.luxuryFeatures.blog) {
    try {
      const posts = getPublishedPosts();
      const first = posts[0];
      if (first) {
        latestPost = {
          title: first.title,
          excerpt: first.excerpt,
          url: `/${params.lang}/blog/${first.slug}`,
          shopUrl: first.skus?.[0]
            ? `/${params.lang}/product/${first.skus[0]}`
            : undefined,
        };
      }
    } catch {
      /* ignore failed blog fetch */
    }
  }

  const cfg = await getReturnLogistics();
  return (
    <>
      {latestPost && <BlogListing posts={[latestPost]} />}
      <PdpClient product={product} />
      <div className="p-6 space-y-1 text-sm text-gray-600">
        {cfg.requireTags && (
          <p>Items must have all tags attached for return.</p>
        )}
        {!cfg.allowWear && (
          <p>Items showing signs of wear may be rejected.</p>
        )}
      </div>
    </>
  );
}
