// apps/shop-bcd/src/app/[lang]/product/[slug]/page.tsx

import { getProductBySlug } from "@/lib/products";
import { LOCALES } from "@acme/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { readRepo } from "@platform-core/repositories/json.server";
import type { ProductPublication } from "@platform-core/src/products";
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

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dm = await draftMode();
  const repo = await readRepo<ProductPublication>(shop.id);
  const entry = repo.find((p) => p.id === params.slug);
  if (!dm.isEnabled && (!entry || entry.status !== "active")) {
    return { title: "Product not found" };
  }
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
  const dm = await draftMode();
  const repo = await readRepo<ProductPublication>(shop.id);
  const entry = repo.find((p) => p.id === params.slug);
  if (!dm.isEnabled && (!entry || entry.status !== "active")) {
    return notFound();
  }

  const product = getProductBySlug(params.slug);
  if (!product) return notFound();

  /* ⬇️  Only data, no event handlers */
  return <PdpClient product={product} />;
}
