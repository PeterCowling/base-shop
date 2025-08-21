// apps/shop-abc/src/app/[lang]/product/[slug]/page.tsx
import type { SKU, ProductPublication, Locale, PageComponent } from "@acme/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { readRepo } from "@platform-core/repositories/json.server";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { LOCALES } from "@acme/i18n";
import shop from "../../../../../shop.json";
import PdpClient from "./PdpClient.client";
import { trackPageView } from "@platform-core/analytics";
import { getReturnLogistics } from "@platform-core/returnLogistics";

async function loadComponents(slug: string): Promise<PageComponent[] | null> {
  const pages = await getPages(shop.id);
  const page = pages.find(
    (p) => p.slug === `product/${slug}` && p.status === "published"
  );
  return page?.components ?? null;
}

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
  // draftMode in Next.js may be asynchronous, returning a promise that resolves to
  // the current draft state. Await it so we can safely read `isEnabled`.
  const { isEnabled } = await draftMode();
  const product = await getProduct(
    params.slug,
    params.lang as Locale,
    isEnabled
  );
  if (!product) return notFound();

  const components = await loadComponents(params.slug);
  await trackPageView(shop.id, `product/${params.slug}`);
  let latestPost: BlogPost | undefined;
  if (shop.luxuryFeatures.contentMerchandising && shop.luxuryFeatures.blog) {
    try {
      const posts = await fetchPublishedPosts(shop.id);
      const first = posts[0];
      if (first) {
        latestPost = {
          title: first.title,
          excerpt: first.excerpt,
          url: `/${params.lang}/blog/${first.slug}`,
          shopUrl: first.products?.[0]
            ? `/${params.lang}/product/${first.products[0]}`
            : undefined,
        };
      }
    } catch {
      /* ignore failed blog fetch */
    }
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

  const cfg = await getReturnLogistics();
  return (
    <>
      {latestPost && <BlogListing posts={[latestPost]} />}
      {content}
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

