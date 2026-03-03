import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

import { ProductMediaCard } from "@/components/catalog/ProductMediaCard";
import { SectionEyebrow } from "@/components/typography/SectionEyebrow";
import {
  getHomeContent,
  getLaunchFamilyCopy,
  getSeoKeywords,
} from "@/lib/contentPacket";
import {
  buildCatalogCardMedia,
  buildLaunchFamilyAnchors,
  getSkuFamilyLabel,
} from "@/lib/launchMerchandising";
import { formatMoney, readShopCurrency, readShopSkus } from "@/lib/shop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const homeContent = getHomeContent(lang);
  return {
    title: `Caryina | ${homeContent.heading}`,
    description: homeContent.summary,
    keywords: getSeoKeywords(),
  };
}

export default async function LocaleHomePage({
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
  const homeContent = getHomeContent(lang);
  const familyCopy = getLaunchFamilyCopy(lang);

  const heroProduct = skus[0] ?? null;
  const heroMedia = heroProduct ? buildCatalogCardMedia(heroProduct) : null;
  const familyAnchors = buildLaunchFamilyAnchors(skus, lang, familyCopy);
  const featuredSkus = skus.slice(0, 4);

  return (
    <section className="space-y-12 sm:space-y-20">
      <div className="hero-grid gap-8 md:items-center">
        <div className="space-y-5">
          <SectionEyebrow>{homeContent.eyebrow}</SectionEyebrow>
          <h1 className="text-4xl font-display leading-none sm:text-5xl">
            {homeContent.heading}
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            {homeContent.summary}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={`/${lang}/shop`}
              className="btn-primary rounded-full px-6 py-2.5 text-sm"
            >
              {homeContent.ctaPrimary}
            </Link>
            <Link
              href={`/${lang}/shop?family=mini`}
              className="rounded-full border px-5 py-2.5 text-sm transition-colors hover:border-current"
            >
              {homeContent.ctaSecondary}
            </Link>
          </div>
        </div>

        <div className="media-aspect-portrait relative overflow-hidden rounded-xl bg-muted">
          {heroMedia ? (
            <Image
              src={heroMedia.primarySrc}
              alt={heroMedia.primaryAlt}
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>
      </div>

      <section className="rounded-lg bg-accent-soft px-6 py-8" aria-label="SEO overview">
        <h2 className="text-2xl font-display">{homeContent.seoHeading}</h2>
        <p className="mt-3 max-w-4xl text-muted-foreground">{homeContent.seoBody}</p>
      </section>

      <div className="space-y-4">
        <div className="space-y-1">
          <SectionEyebrow>Curated</SectionEyebrow>
          <h2 className="text-2xl font-display">The collections</h2>
        </div>
        <ul className="grid list-none grid-cols-2 gap-4 lg:grid-cols-3">
          {familyAnchors.map((family) => (
            <li key={family.key}>
              <Link href={family.href} className="group block space-y-2">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={family.heroImageSrc}
                    alt={`${family.label} collection`}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 30vw"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-display sm:text-base">{family.label}</p>
                  <p className="hidden text-sm text-muted-foreground sm:block">{family.description}</p>
                  <p className="text-xs text-muted-foreground">
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
          <div className="space-y-1">
            <SectionEyebrow>Just landed</SectionEyebrow>
            <h2 className="text-2xl font-display">New arrivals</h2>
          </div>
          <Link href={`/${lang}/shop`} className="text-sm text-muted-foreground hover:underline">
            See full catalog
          </Link>
        </div>
        {featuredSkus.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
            Catalog is empty. Add active products in
            `data/shops/caryina/products.json`.
          </div>
        ) : (
          <ul className="grid list-none grid-cols-2 gap-5 lg:grid-cols-3">
            {featuredSkus.map((sku, index) => {
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
      </div>

      <section className="space-y-4" aria-label="Common questions">
        <h2 className="text-2xl font-display">{homeContent.faqHeading}</h2>
        <ul className="grid gap-4 list-none sm:grid-cols-3">
          {homeContent.faqItems.map((item) => (
            <li
              key={item.question}
              className="rounded-lg border bg-card p-6"
            >
              <h3 className="text-sm font-medium">{item.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
