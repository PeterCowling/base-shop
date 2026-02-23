import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { resolveLocale } from "@acme/i18n/locales";

import { ProductMediaCard } from "@/components/catalog/ProductMediaCard";
import {
  buildCatalogCardMedia,
  buildLaunchFamilyAnchors,
} from "@/lib/launchMerchandising";
import { formatMoney, readShopCurrency, readShopSkus } from "@/lib/shop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);
  return {
    title: `Caryina (${lang}) | Image-first launch`,
  };
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);
  const [skus, currency] = await Promise.all([
    readShopSkus(lang),
    readShopCurrency(),
  ]);

  const heroProduct = skus[0] ?? null;
  const heroMedia = heroProduct ? buildCatalogCardMedia(heroProduct) : null;
  const familyAnchors = buildLaunchFamilyAnchors(skus, lang);
  const featuredSkus = skus.slice(0, 4);

  return (
    <section className="space-y-14">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Caryina Launch Edit
          </p>
          <h1 className="text-5xl font-display leading-none sm:text-6xl">
            Image-first bag stories for a 60-variant launch.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Shop by silhouette, then inspect every bag through a deterministic
            six-shot sequence: hero, angle, detail, on-body, scale, alternate.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${lang}/shop`}
              className="rounded-full border border-solid px-5 py-2 text-sm hover:bg-muted"
              style={{ borderColor: "hsl(var(--color-border-default))" }}
            >
              Browse all bags
            </Link>
            <Link
              href={`/${lang}/shop?family=mini`}
              className="rounded-full px-5 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              View mini silhouettes
            </Link>
          </div>
        </div>

        <div
          className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-solid bg-muted"
          style={{ borderColor: "hsl(var(--color-border-default))" }}
        >
          {heroMedia ? (
            <Image
              src={heroMedia.primarySrc}
              alt={heroMedia.primaryAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-display">Launch family hubs</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {familyAnchors.map((family) => (
            <li key={family.key}>
              <Link href={family.href} className="group block space-y-3">
                <div
                  className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-solid bg-muted"
                  style={{ borderColor: "hsl(var(--color-border-default))" }}
                >
                  <Image
                    src={family.heroImageSrc}
                    alt={`${family.label} family`}
                    fill
                    sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{family.label}</p>
                  <p className="text-sm text-muted-foreground">{family.description}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {family.productCount} products
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-display">Featured at launch</h2>
          <Link href={`/${lang}/shop`} className="text-sm text-muted-foreground hover:underline">
            See full catalog
          </Link>
        </div>
        {featuredSkus.length === 0 ? (
          <div
            className="rounded-3xl border border-dashed p-8 text-sm text-muted-foreground"
            style={{ borderColor: "hsl(var(--color-border-default))" }}
          >
            Catalog is empty. Add active products in
            `data/shops/caryina/products.json`.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {featuredSkus.map((sku) => {
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
      </div>
    </section>
  );
}
