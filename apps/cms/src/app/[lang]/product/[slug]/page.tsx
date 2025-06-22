// apps/cms/src/app/[lang]/product/[slug]/page.tsx
import { getProductBySlug } from "@platform-core/products";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PdpClient from "./PdpClient";

/* -------------------------------------------------------------------------- */
/*  Static generation                                                         */
/* -------------------------------------------------------------------------- */

export async function generateStaticParams() {
  const langs = ["en", "de", "it"] as const;
  const slugs = ["green-sneaker", "sand-sneaker", "black-sneaker"] as const;

  return langs.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export const revalidate = 60;

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type RouteParams = { lang: string; slug: string };

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                  */
/* -------------------------------------------------------------------------- */

export function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Metadata {
  const product = getProductBySlug(params.slug);
  return {
    title: product ? `${product.title} · Base-Shop` : "Product not found",
  };
}

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default function ProductDetailPage({ params }: { params: RouteParams }) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();

  return <PdpClient product={product} />;
}
