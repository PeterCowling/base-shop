"use client";
import Image from "next/image";
import * as React from "react";
import { useTranslations } from "@acme/i18n";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { ProductBadge } from "../atoms/ProductBadge";
import type { SKU } from "@acme/types";
import { Stack, Inline } from "../atoms/primitives";

export interface ProductDetailTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU & {
    badges?: { label: string; variant?: "default" | "sale" | "new" }[];
  };
  onAddToCart?: (product: SKU) => void;
  ctaLabel?: string;
}

export function ProductDetailTemplate({
  product,
  onAddToCart,
  ctaLabel: ctaLabelProp,
  className,
  ...props
}: ProductDetailTemplateProps) {
  const t = useTranslations();
  const ctaLabel = ctaLabelProp ?? t("actions.addToCart");
  const firstMedia = product.media?.[0];
  const gridLayout = "grid gap-6 md:grid-cols-2"; // i18n-exempt: layout class names
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
        {product.badges && (
          <Inline gap={2}>
            {product.badges.map(
              (
                b: { label: string; variant?: "default" | "sale" | "new" },
                idx: number
              ) => (
                <ProductBadge key={idx} label={b.label} variant={b.variant} />
              )
            )}
          </Inline>
        )}
        {typeof product.price === "number" && (
          <Price amount={product.price} className="text-xl font-bold" />
        )}
        {product.description && <p>{product.description}</p>}
        {onAddToCart && (
          <Button onClick={() => onAddToCart(product)}>{ctaLabel}</Button>
        )}
      </Stack>
    </div>
  );
}
