"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

import { useTranslations } from "@acme/i18n";

import Price from "@/components/Price";
import { useLocale } from "@/contexts/LocaleContext";
import { withLocale } from "@/lib/routes";
import type { Product } from "@/types/product";

const ProductCard = React.memo(function ProductCard({
  product,
}: {
  product: Product;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const prices = useMemo(
    () => product.variants.map((variant) => variant.price),
    [product.variants]
  );

  const minPrice = useMemo(() => (prices.length ? Math.min(...prices) : 0), [prices]);
  const maxPrice = useMemo(() => (prices.length ? Math.max(...prices) : 0), [prices]);
  const heroImage = product.images[0];
  const currency = product.variants[0]?.currency ?? "USD";
  const hasPrices = prices.length > 0;
  // i18n-exempt -- CF-1004 image sizes attribute [ttl=2026-12-31]
  const heroSizes = "(max-width: 480px) 100vw, 420px";

  const productHref = useMemo(
    () => withLocale(`/product/${product.slug}`, locale),
    [locale, product.slug]
  );

  return (
    <article className="surface animate-fade-up rounded-3xl border border-border-1 p-5">
      <div className="relative aspect-card overflow-hidden rounded-2xl bg-surface-2">
        {heroImage ? (
          <Image
            src={heroImage.src}
            alt={t(heroImage.alt) as string}
            fill
            sizes={heroSizes}
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="mt-4 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t(product.style) as string}
        </div>
        <h3 className="font-display text-xl font-semibold">
          {t(product.name) as string}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t(product.shortDescription) as string}
        </p>
        <div className="text-sm font-semibold text-foreground">
          {hasPrices ? (
            minPrice === maxPrice ? (
              <Price amount={minPrice} currency={currency} />
            ) : (
              <span>
                {t("product.from") as string} <Price amount={minPrice} currency={currency} />
              </span>
            )
          ) : (
            <span>{t("product.outOfStock") as string}</span>
          )}
        </div>
        <Link
          href={productHref}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-border-1 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:text-accent focus-visible:focus-ring"
        >
          {t("product.viewDetails") as string}
        </Link>
      </div>
    </article>
  );
});

export default ProductCard;
