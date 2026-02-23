import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { type Locale, LOCALES, resolveLocale } from "@acme/i18n/locales";

import {
  formatMoney,
  readShopCurrency,
  readShopSkuBySlug,
  readShopSkus,
} from "@/lib/shop";

import ProductAnalytics from "./ProductAnalytics.client";

export async function generateStaticParams() {
  const skus = await readShopSkus("en");
  return LOCALES.flatMap((lang) => skus.map((sku) => ({ lang, slug: sku.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const product = await readShopSkuBySlug(lang, slug);
  return {
    title: product ? `${product.title} | Caryina` : "Product not found | Caryina",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ lang?: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const [product, currency] = await Promise.all([
    readShopSkuBySlug(lang, slug),
    readShopCurrency(),
  ]);

  if (!product) return notFound();

  return (
    <>
      <ProductAnalytics locale={lang} productId={product.id} />
      <article className="space-y-8">
        <Link href={`/${lang}/shop`} className="text-sm text-muted-foreground hover:underline">
          Back to shop
        </Link>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {product.slug}
          </p>
          <h1 className="text-4xl font-display">{product.title}</h1>
          <p className="max-w-2xl text-muted-foreground">{product.description}</p>
        </div>

        <div
          className="rounded-3xl border border-solid p-6"
          style={{ borderColor: "hsl(var(--color-border-default))" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg">{formatMoney(product.price, currency)}</p>
            <Link
              href={`/${lang}/checkout?sku=${encodeURIComponent(product.slug)}`}
              className="rounded-full border border-solid px-5 py-2 text-sm hover:bg-muted"
              style={{ borderColor: "hsl(var(--color-border-default))" }}
            >
              Continue to checkout
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
