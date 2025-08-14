// apps/shop-bcd/src/app/[lang]/product/[slug]/page.tsx

import { getProductBySlug } from "@/lib/products";
import { LOCALES } from "@acme/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PdpClient from "./PdpClient.client";
import { getReturnLogistics } from "@platform-core/returnLogistics";

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
  params: { slug: string };
}) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();
  const cfg = await getReturnLogistics();
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
