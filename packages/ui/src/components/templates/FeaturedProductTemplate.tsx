"use client";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { RatingStars } from "../atoms/RatingStars";
import type { SKU } from "@acme/types";
import { ProductFeatures } from "../organisms/ProductFeatures";
import { Stack } from "../atoms/primitives";

export interface FeaturedProductTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU & { rating?: number; features?: string[] };
  onAddToCart?: (product: SKU) => void;
  ctaLabel?: string;
}

export function FeaturedProductTemplate({
  product,
  onAddToCart,
  ctaLabel: ctaLabelProp,
  className,
  ...props
}: FeaturedProductTemplateProps) {
  const t = useTranslations();
  const ctaLabel = ctaLabelProp ?? t("actions.addToCart");
  const firstMedia = product.media?.[0];
  const gridLayout = "grid gap-6 md:grid-cols-2"; // i18n-exempt: layout class names
  const priceClass = "text-xl font-bold"; // i18n-exempt: style tokens
  const mediaClass = "rounded-md object-cover"; // i18n-exempt: style tokens
  const imgSizes = "(min-width: 768px) 50vw, 100vw"; // i18n-exempt: media attribute
  const mediaBase = "h-full w-full"; // i18n-exempt: style tokens
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
