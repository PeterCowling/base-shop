import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { type Locale, LOCALES, resolveLocale } from "@acme/i18n/locales";

import { ProductGallery } from "@/components/catalog/ProductGallery.client";
import { ProductMediaCard } from "@/components/catalog/ProductMediaCard";
import {
  buildCatalogCardMedia,
  buildProductGalleryItems,
} from "@/lib/launchMerchandising";
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
  const allProducts = await readShopSkus(lang);
  const galleryItems = buildProductGalleryItems(product);
  const relatedProducts = allProducts
    .filter((sku) => sku.id !== product.id)
    .slice(0, 8);

  return (
    <>
      <ProductAnalytics locale={lang} productId={product.id} />
      <article className="space-y-10">
        <Link href={`/${lang}/shop`} className="text-sm text-muted-foreground hover:underline">
          Back to shop
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <ProductGallery productTitle={product.title} items={galleryItems} />

          <div className="space-y-5">
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

            <section
              className="rounded-3xl border border-solid p-5"
              style={{ borderColor: "hsl(var(--color-border-default))" }}
              aria-label="Product proof points"
            >
              <h2 className="text-base font-medium">Visual trust checklist</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Hero, angle, detail, on-body, scale, and alternate views.</li>
                <li>Consistent 4:5 framing for cross-product comparison.</li>
                <li>Keyboard-accessible gallery controls with ordered progression.</li>
              </ul>
            </section>
          </div>
        </div>

        {relatedProducts.length > 0 ? (
          <section className="space-y-4" aria-label="Related products">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-display">Related silhouettes</h2>
              <Link href={`/${lang}/shop`} className="text-sm text-muted-foreground hover:underline">
                View all
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {relatedProducts.map((relatedSku) => {
                const media = buildCatalogCardMedia(relatedSku);
                return (
                  <li key={relatedSku.id}>
                    <ProductMediaCard
                      href={`/${lang}/product/${relatedSku.slug}`}
                      slug={relatedSku.slug}
                      title={relatedSku.title}
                      priceLabel={formatMoney(relatedSku.price, currency)}
                      primarySrc={media.primarySrc}
                      primaryAlt={media.primaryAlt}
                      secondarySrc={media.secondarySrc}
                      secondaryAlt={media.secondaryAlt}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </article>
    </>
  );
}
