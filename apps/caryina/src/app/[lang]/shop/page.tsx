import type { Metadata } from "next";
import Link from "next/link";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

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
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const [skus, currency] = await Promise.all([
    readShopSkus(lang),
    readShopCurrency(),
  ]);

  return (
    <>
      <ShopAnalytics locale={lang} />
      <section className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Caryina V1
          </p>
          <h1 className="text-4xl font-display">Shop</h1>
          <p className="max-w-2xl text-muted-foreground">
            First-build catalog framework with live data from
            `data/shops/caryina/products.json`.
          </p>
        </div>

        {skus.length === 0 ? (
          <div
            className="rounded-3xl border border-dashed p-8 text-sm text-muted-foreground"
            style={{ borderColor: "hsl(var(--color-border-default))" }}
          >
            No active products found yet. Populate `data/shops/caryina/products.json`
            and `data/shops/caryina/inventory.json` to render the catalog.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skus.map((sku) => (
              <li
                key={sku.id}
                className="rounded-3xl border border-solid bg-card p-6"
                style={{ borderColor: "hsl(var(--color-border-default))" }}
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      {sku.slug}
                    </p>
                    <h2 className="text-xl font-display">{sku.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {sku.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm">
                      {formatMoney(sku.price, currency)}
                    </p>
                    <Link
                      href={`/${lang}/product/${sku.slug}`}
                      className="rounded-full border border-solid px-4 py-2 text-sm hover:bg-muted"
                      style={{
                        borderColor: "hsl(var(--color-border-default))",
                      }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
