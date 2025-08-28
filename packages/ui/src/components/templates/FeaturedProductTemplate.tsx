"use client";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { RatingStars } from "../atoms/RatingStars";
import type { SKU } from "@acme/types";
import { ProductFeatures } from "../organisms/ProductFeatures";

export interface FeaturedProductTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU & { rating?: number; features?: string[] };
  onAddToCart?: (product: SKU) => void;
  ctaLabel?: string;
}

export function FeaturedProductTemplate({
  product,
  onAddToCart,
  ctaLabel = "Add to cart",
  className,
  ...props
}: FeaturedProductTemplateProps) {
  const firstMedia = product.media?.[0];
  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)} {...props}>
      {firstMedia?.url && (
        <div className="relative aspect-square w-full">
          {firstMedia.type === "image" ? (
            <Image
              src={firstMedia.url}
              alt={product.title ?? ""}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="rounded-md object-cover"
            />
          ) : (
            <video
              src={firstMedia.url}
              className="h-full w-full rounded-md object-cover"
              muted
              playsInline
            />
          )}
        </div>
      )}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">{product.title}</h2>
        {product.rating !== undefined && (
          <RatingStars rating={product.rating} className="self-start" />
        )}
        {typeof product.price === "number" && (
          <Price amount={product.price} className="text-xl font-bold" />
        )}
        {product.features && <ProductFeatures features={product.features} />}
        {onAddToCart && (
          <Button onClick={() => onAddToCart(product)}>{ctaLabel}</Button>
        )}
      </div>
    </div>
  );
}
