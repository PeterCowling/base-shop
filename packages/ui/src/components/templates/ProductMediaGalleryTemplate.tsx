"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { ProductBadge } from "../atoms/ProductBadge";
import type { MediaItem as GalleryMediaItem } from "../molecules/MediaSelector";
import type { SKU } from "@acme/types";
import { ProductGallery } from "../organisms/ProductGallery";
import { Grid, Inline, Stack } from "../atoms/primitives";

export interface ProductMediaGalleryTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU & {
    badges?: { label: string; variant?: "default" | "sale" | "new" }[];
  };
  onAddToCart?: (product: SKU) => void;
  ctaLabel?: string;
}

export function ProductMediaGalleryTemplate({
  product,
  onAddToCart,
  ctaLabel: ctaLabelProp,
  className,
  ...props
}: ProductMediaGalleryTemplateProps) {
  const t = useTranslations();
  const ctaLabel = ctaLabelProp ?? t("actions.addToCart");
  const galleryMedia: GalleryMediaItem[] = (product.media ?? [])
    .filter(
      (m): m is NonNullable<SKU["media"]>[number] & { url: string } =>
        !!m?.url
    )
    .map((m) => ({
      type: m.type as GalleryMediaItem["type"],
      src: m.url,
      alt: m.altText,
    }));
  return (
    <Grid cols={1} gap={6} className={cn("md:grid-cols-2", className)} {...props}>
      <ProductGallery media={galleryMedia} />
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
    </Grid>
  );
}
