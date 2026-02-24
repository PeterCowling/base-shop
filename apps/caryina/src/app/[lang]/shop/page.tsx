import type { Metadata } from "next";
import Link from "next/link";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

import { ProductMediaCard } from "@/components/catalog/ProductMediaCard";
import {
  buildCatalogCardMedia,
  buildLaunchFamilyAnchors,
  filterSkusByLaunchFamily,
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
  const lang = resolveLocale(rawLang);
  return {
    title: `Shop (${lang}) | Caryina`,
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
  const familyAnchors = buildLaunchFamilyAnchors(skus, lang);
  const filteredSkus = filterSkusByLaunchFamily(skus, activeFamily);
  const hasUnknownFamily = Boolean(familyParam) && activeFamily === null;

  return (
    <>
      <ShopAnalytics locale={lang} />
      <section className="space-y-10">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Image-first product listing
            </p>
            <h1 className="text-5xl font-display">Shop all bags</h1>
            <p className="max-w-3xl text-muted-foreground">
              Mobile is 2-up, desktop is 4-up. Each card leads with hero imagery
              and reveals a secondary angle on pointer-hover devices.
            </p>
          </div>

          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={`/${lang}/shop`}
                className={`inline-flex rounded-full border border-solid px-4 py-2 text-sm ${
                  activeFamily === null ? "bg-muted" : ""
                }`}
                style={{ borderColor: "hsl(var(--color-border-default))" }}
              >
                All families
              </Link>
            </li>
            {LAUNCH_FAMILY_ANCHORS.map((family) => (
              <li key={family.key}>
                <Link
                  href={`/${lang}/shop?family=${family.key}`}
                  className={`inline-flex rounded-full border border-solid px-4 py-2 text-sm ${
                    activeFamily === family.key ? "bg-muted" : ""
                  }`}
                  style={{ borderColor: "hsl(var(--color-border-default))" }}
                >
                  {family.label}
                </Link>
              </li>
            ))}
          </ul>
          {hasUnknownFamily ? (
            <p className="text-sm text-muted-foreground">
              Unknown family filter. Showing all families.
            </p>
          ) : null}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {familyAnchors.map((family) => (
            <li
              key={family.key}
              className="rounded-3xl border border-solid bg-card px-5 py-4"
              style={{ borderColor: "hsl(var(--color-border-default))" }}
            >
              <Link href={family.href} className="block">
                <p className="text-sm font-medium">{family.label}</p>
                <p className="text-sm text-muted-foreground">{family.description}</p>
                <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                  {family.productCount} products
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {skus.length === 0 ? (
          <div
            className="rounded-3xl border border-dashed p-8 text-sm text-muted-foreground"
            style={{ borderColor: "hsl(var(--color-border-default))" }}
          >
            No active products found yet. Populate `data/shops/caryina/products.json`
            and `data/shops/caryina/inventory.json` to render the catalog.
          </div>
        ) : filteredSkus.length === 0 ? (
          <div
            className="rounded-3xl border border-dashed p-8 text-sm text-muted-foreground"
            style={{ borderColor: "hsl(var(--color-border-default))" }}
          >
            No products are currently assigned to this family.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {filteredSkus.map((sku) => {
              const media = buildCatalogCardMedia(sku);
              return (
                <li key={sku.id}>
                  <ProductMediaCard
                    href={`/${lang}/product/${sku.slug}`}
                    slug={sku.slug}
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
      </section>
    </>
  );
}
