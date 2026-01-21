// apps/cms/src/app/[lang]/product/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LOCALES } from "@acme/i18n";
import { getProductBySlug } from "@acme/platform-core/products";

import PdpClient from "./PdpClient.client";

/* -------------------------------------------------------------------------- */
/*  Static generation                                                         */
/* -------------------------------------------------------------------------- */

/** Pre‑build every locale/slug pair. */
export async function generateStaticParams() {
  const langs = LOCALES;
  const slugs = ["green-sneaker", "sand-sneaker", "black-sneaker"] as const;

  return langs.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

/** ISR revalidation window (seconds). */
export const revalidate = 60;

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type Params = { lang: string; slug: string };

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                  */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  return {
    title: product ? `${product.title} · Base‑Shop` : "Product not found",
  };
}

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return notFound();

  return <PdpClient product={product as any} />;
}
