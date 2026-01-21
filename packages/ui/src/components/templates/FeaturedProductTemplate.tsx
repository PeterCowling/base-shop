"use client"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: Next.js directive string
import * as React from "react";
import Image from "next/image";

import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@acme/i18n/resolveText";
import type { SKU } from "@acme/types";
import type { TranslatableText } from "@acme/types/i18n";

import { cn } from "../../utils/style";
import { Price } from "../atoms/Price";
import { Stack } from "../atoms/primitives";
import { RatingStars } from "../atoms/RatingStars";
import { Button } from "../atoms/shadcn";
import { ProductFeatures } from "../organisms/ProductFeatures";

export interface FeaturedProductTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU & { rating?: number; features?: string[] };
  onAddToCart?: (product: SKU) => void;
  ctaLabel?: TranslatableText;
  locale?: Locale;
}

export function FeaturedProductTemplate({
  product,
  onAddToCart,
  ctaLabel: ctaLabelProp,
  locale = "en",
  className,
  ...props
}: FeaturedProductTemplateProps) {
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
  const ctaLabel = (() => {
    if (!ctaLabelProp) {
      const v = t("actions.addToCart") as string;
      return v === "actions.addToCart" ? "Add to cart" : v; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: fallback when key unresolved
    }
    if (typeof ctaLabelProp === "string") return ctaLabelProp;
    if (ctaLabelProp.type === "key") return t(ctaLabelProp.key, ctaLabelProp.params) as string;
    if (ctaLabelProp.type === "inline") return resolveText(ctaLabelProp, locale, t);
    return "Add to cart"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: defensive fallback
  })();
  const firstMedia = product.media?.[0];
  const gridLayout = "grid gap-6 md:grid-cols-2"; // i18n-exempt -- DS-0001 [ttl=2026-01-31]
  const priceClass = "text-xl font-bold"; // i18n-exempt -- DS-0001 [ttl=2026-01-31]
  const mediaClass = "rounded-md object-cover"; // i18n-exempt -- DS-0001 [ttl=2026-01-31]
  const imgSizes = "(min-width: 768px) 50vw, 100vw"; // i18n-exempt -- DS-0001 [ttl=2026-01-31]
  const mediaBase = "h-full w-full"; // i18n-exempt -- DS-0001 [ttl=2026-01-31]
  return (
    <div className={cn(gridLayout, className)} {...props}>
      {firstMedia?.url && (
        <div className="relative aspect-square w-full">
          {firstMedia.type === "image" ? (
            <Image
              src={firstMedia.url}
              alt={product.title ?? ""}
              fill
              sizes={imgSizes}
              className={mediaClass}
            />
          ) : (
            <video
              src={firstMedia.url}
              className={cn(mediaBase, mediaClass)}
              data-aspect="1/1"
              muted
              playsInline
            />
          )}
        </div>
      )}
      <Stack gap={4}>
        <h2 className="text-2xl font-semibold">{product.title}</h2>
        {product.rating !== undefined && (
          <RatingStars rating={product.rating} className="self-start" />
        )}
        {typeof product.price === "number" && (
          <Price amount={product.price} className={priceClass} />
        )}
        {product.features && <ProductFeatures features={product.features} />}
        {onAddToCart && (
          <Button onClick={() => onAddToCart(product)}>{ctaLabel}</Button>
        )}
      </Stack>
    </div>
  );
}
