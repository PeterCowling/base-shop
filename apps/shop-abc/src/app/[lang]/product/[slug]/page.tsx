// apps/shop-abc/src/app/[lang]/product/[slug]/page.tsx
import { getProductBySlug } from "@/lib/products";
import type { PageComponent } from "@acme/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { LOCALES } from "@acme/i18n";
import { env } from "@acme/config";
import shop from "../../../../../shop.json";
import PdpClient from "./PdpClient.client";
import { trackPageView } from "@platform-core/analytics";

async function loadComponents(slug: string): Promise<PageComponent[] | null> {
  const pages = await getPages(shop.id);
  const page = pages.find(
    (p) => p.slug === `product/${slug}` && p.status === "published"
  );
  return page?.components ?? null;
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
  params: { slug: string; lang: string };
}) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();

  const components = await loadComponents(params.slug);
  await trackPageView(shop.id, `product/${params.slug}`);
  let latestPost: BlogPost | undefined;
  try {
    const luxury = JSON.parse(env.NEXT_PUBLIC_LUXURY_FEATURES ?? "{}");
    if (luxury.contentMerchandising) {
      const posts = await fetchPublishedPosts(shop.id);
      const first = posts[0];
      if (first) {
        latestPost = {
          title: first.title,
          excerpt: first.excerpt,
          url: `/${params.lang}/blog/${first.slug}`,
        };
      }
    }
  } catch {
    /* ignore bad feature flags */
  }

  const content =
    components && components.length ? (
      <DynamicRenderer
        components={components}
        locale={params.lang}
        runtimeData={{ ProductDetailTemplate: { product } }}
      />
    ) : (
      <PdpClient product={product} />
    );

  return (
    <>
      {latestPost && <BlogListing posts={[latestPost]} />}
      {content}
    </>
  );
}

