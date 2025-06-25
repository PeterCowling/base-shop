// apps/shop-abc/src/app/[lang]/[lang]/product/[slug]/page.tsx
import { getProductBySlug } from "@/lib/products";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PdpClient from "./PdpClient";

export async function generateStaticParams() {
  return ["en", "de", "it"].flatMap((lang) =>
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
  params: { slug: string };
}) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();

  /* ⬇️  Only data, no event handlers */
  return <PdpClient product={product} />;
}
