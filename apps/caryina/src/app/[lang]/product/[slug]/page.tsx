import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { type Locale, LOCALES, resolveLocale } from "@acme/i18n/locales";
import AddToCartButton from "@acme/platform-core/components/shop/AddToCartButton.client";

import { ProductGallery } from "@/components/catalog/ProductGallery.client";
import { ProductMediaCard } from "@/components/catalog/ProductMediaCard";
import { StockBadge } from "@/components/catalog/StockBadge";
import {
  getLaunchFamilyCopy,
  getProductPageContent,
  getSeoKeywords,
} from "@/lib/contentPacket";
import {
  buildCatalogCardMedia,
  buildProductGalleryItems,
  getSkuFamilyLabel,
} from "@/lib/launchMerchandising";
import {
  formatMoney,
  readShopCurrency,
  readShopInventory,
  readShopSkuBySlug,
  readShopSkus,
} from "@/lib/shop";

import ProductAnalytics from "./ProductAnalytics.client";
import { StickyCheckoutBar } from "./StickyCheckoutBar.client";

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
    description: product?.description ?? "Caryina launch product detail page",
    keywords: getSeoKeywords(),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ lang?: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const [product, currency, inventoryItems] = await Promise.all([
    readShopSkuBySlug(lang, slug),
    readShopCurrency(),
    readShopInventory(),
  ]);

  if (!product) return notFound();
  const inventoryItem = inventoryItems.find((item) => item.productId === product.id);
  const lowStockThreshold = inventoryItem?.lowStockThreshold ?? 2;
  const allProducts = await readShopSkus(lang);
  const productPageContent = getProductPageContent(lang);
  const familyCopy = getLaunchFamilyCopy(lang);
  const galleryItems = buildProductGalleryItems(product);
  const productIndex = allProducts.findIndex((s) => s.id === product.id);
  const familyLabel = getSkuFamilyLabel(product, Math.max(0, productIndex), familyCopy);
  const relatedProducts = allProducts
    .filter((sku) => sku.id !== product.id)
    .slice(0, 8);

  return (
    <>
      <ProductAnalytics locale={lang} productId={product.id} />
      <article className="space-y-16">
        <Link
          href={`/${lang}/shop`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <span aria-hidden="true">&larr;</span> Back to shop
        </Link>

        <div className="pdp-grid gap-10 md:items-start">
          <ProductGallery productTitle={product.title} items={galleryItems} />

          <div className="space-y-6 md:sticky md:top-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {familyLabel}
              </p>
              <h1 className="text-3xl font-display sm:text-4xl">{product.title}</h1>
              <p className="max-w-2xl text-muted-foreground">{product.description}</p>
            </div>

            <div className="space-y-4">
              <p className="text-xl font-medium">{formatMoney(product.price, currency)}</p>
              <StockBadge stock={product.stock} lowStockThreshold={lowStockThreshold} />
              <div data-cy="pdp-checkout">
                <AddToCartButton sku={product} disabled={product.stock === 0} />
              </div>
              <StickyCheckoutBar
                priceLabel={formatMoney(product.price, currency)}
                sku={product}
              />
            </div>

            <section
              className="space-y-3 border-t pt-5"
              aria-label="Product proof points"
            >
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {productPageContent.proofHeading}
              </h2>
              <ul className="list-none space-y-2 text-sm text-muted-foreground">
                {productPageContent.proofBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {relatedProducts.length > 0 ? (
          <section className="space-y-5" aria-label="Related products">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-display">
                {productPageContent.relatedHeading}
              </h2>
              <Link href={`/${lang}/shop`} className="text-sm text-muted-foreground hover:underline">
                See all
              </Link>
            </div>
            <ul className="grid list-none grid-cols-2 gap-5 lg:grid-cols-3">
              {relatedProducts.map((relatedSku, idx) => {
                const media = buildCatalogCardMedia(relatedSku);
                return (
                  <li key={relatedSku.id}>
                    <ProductMediaCard
                      href={`/${lang}/product/${relatedSku.slug}`}
                      category={getSkuFamilyLabel(relatedSku, idx, familyCopy)}
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
