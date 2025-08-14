// apps/shop-abc/src/app/[lang]/product/[slug]/page.tsx
import { getProductBySlug } from "@/lib/products";
import type { PageComponent } from "@acme/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DynamicRenderer from "@ui/components/DynamicRenderer";
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
  const cfg = await getReturnLogistics();
  if (components && components.length) {
    return (
      <>
        <DynamicRenderer
          components={components}
          locale={params.lang}
          runtimeData={{ ProductDetailTemplate: { product } }}
        />
        <ReturnConditions cfg={cfg} />
      </>
    );
  }
  return (
    <>
      <PdpClient product={product} />
      <ReturnConditions cfg={cfg} />
    </>
  );
}

function ReturnConditions({
  cfg,
}: {
  cfg: Awaited<ReturnType<typeof getReturnLogistics>>;
}) {
  return (
    <div className="p-6 text-sm text-gray-700 space-y-1">
      {cfg.requireTags && <p>Original tags must be attached for returns.</p>}
      {cfg.allowWear === false && <p>Items must be returned unworn.</p>}
    </div>
  );
}

