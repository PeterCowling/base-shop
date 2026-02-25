import type { Metadata } from "next";
import Link from "next/link";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

import { ProductMediaCard } from "@/components/catalog/ProductMediaCard";
import {
  getLaunchFamilyCopy,
  getSeoKeywords,
  getShopContent,
} from "@/lib/contentPacket";
import {
  buildCatalogCardMedia,
  filterSkusByLaunchFamily,
  getSkuFamilyLabel,
  LAUNCH_FAMILY_ANCHORS,
  resolveLaunchFamily,
} from "@/lib/launchMerchandising";
import { formatMoney, readShopCurrency, readShopSkus } from "@/lib/shop";

import ShopAnalytics from "./ShopAnalytics.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const shopContent = getShopContent(lang);
  return {
    title: `${shopContent.heading} | Caryina`,
    description: shopContent.summary,
    keywords: getSeoKeywords(),
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang?: string }>;
  searchParams: Promise<{ family?: string | string[] }>;
}) {
  const { lang: rawLang } = await params;
  const { family: rawFamily } = await searchParams;
  const lang: Locale = resolveLocale(rawLang);
  const familyParam = Array.isArray(rawFamily) ? rawFamily[0] : rawFamily;
  const activeFamily = resolveLaunchFamily(familyParam);
  const [skus, currency] = await Promise.all([
    readShopSkus(lang),
    readShopCurrency(),
  ]);
  const shopContent = getShopContent(lang);
  const familyCopy = getLaunchFamilyCopy(lang);
  const filteredSkus = filterSkusByLaunchFamily(skus, activeFamily);
  const hasUnknownFamily = Boolean(familyParam) && activeFamily === null;

  return (
    <>
      <ShopAnalytics locale={lang} />
      <section className="space-y-10">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest" style={{ color: "hsl(var(--color-accent))" }}>
              {shopContent.eyebrow}
            </p>
            <h1 className="text-3xl font-display sm:text-4xl">{shopContent.heading}</h1>
            <p className="max-w-3xl text-muted-foreground">
              {shopContent.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ul className="flex list-none flex-wrap gap-2">
              <li>
                <Link
                  href={`/${lang}/shop`}
                  className={`inline-flex rounded-full border px-4 py-2 text-sm ${
                    activeFamily === null ? "btn-primary" : ""
                  }`}
                >
                  All
                </Link>
              </li>
              {LAUNCH_FAMILY_ANCHORS.map((family) => (
                <li key={family.key}>
                  <Link
                    href={`/${lang}/shop?family=${family.key}`}
                    className={`inline-flex rounded-full border px-4 py-2 text-sm ${
                      activeFamily === family.key ? "btn-primary" : ""
                    }`}
                  >
                    {familyCopy[family.key]?.label ?? family.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              {filteredSkus.length} {filteredSkus.length === 1 ? "product" : "products"}
            </p>
          </div>

          {hasUnknownFamily ? (
            <p className="text-sm text-muted-foreground">
              Unknown family filter. Showing all products.
            </p>
          ) : null}
        </div>

        {skus.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
            No active products found yet. Populate `data/shops/caryina/products.json`
            and `data/shops/caryina/inventory.json` to render the catalog.
          </div>
        ) : filteredSkus.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
            No products are currently assigned to this family.
          </div>
        ) : (
          <ul className="grid list-none grid-cols-2 gap-5 lg:grid-cols-3">
            {filteredSkus.map((sku, index) => {
              const media = buildCatalogCardMedia(sku);
              return (
                <li key={sku.id}>
                  <ProductMediaCard
                    href={`/${lang}/product/${sku.slug}`}
                    category={getSkuFamilyLabel(sku, index, familyCopy)}
                    title={sku.title}
                    priceLabel={formatMoney(sku.price, currency)}
                    primarySrc={media.primarySrc}
                    primaryAlt={media.primaryAlt}
                    secondarySrc={media.secondarySrc}
                    secondaryAlt={media.secondaryAlt}
                  />
                </li>
              );
            })}
          </ul>
        )}

        <section className="rounded-lg bg-accent-soft px-6 py-6">
          <ul className="grid list-none gap-x-6 gap-y-2 text-sm text-muted-foreground sm:grid-cols-3">
            {shopContent.trustBullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-accent" />
                {bullet}
              </li>
            ))}
          </ul>
        </section>
      </section>
    </>
  );
}
