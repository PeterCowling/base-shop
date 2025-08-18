import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { ProductBadge } from "../atoms/ProductBadge";
import type { MediaItem as GalleryMediaItem } from "../molecules/MediaSelector";
import type { SKU } from "@acme/types";
import { ProductGallery } from "../organisms/ProductGallery";

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
  ctaLabel = "Add to cart",
  className,
  ...props
}: ProductMediaGalleryTemplateProps) {
  const galleryMedia: GalleryMediaItem[] = product.media.map(
    (m: SKU["media"][number]) => ({
      type: m.type as GalleryMediaItem["type"],
      src: m.url,
      alt: m.altText,
    })
  );
  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)} {...props}>
      <ProductGallery media={galleryMedia} />
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">{product.title}</h2>
        {product.badges && (
          <div className="flex gap-2">
            {product.badges.map(
              (
                b: { label: string; variant?: "default" | "sale" | "new" },
                idx: number
              ) => (
                <ProductBadge key={idx} label={b.label} variant={b.variant} />
              )
            )}
          </div>
        )}
        <Price amount={product.price} className="text-xl font-bold" />
        {product.description && <p>{product.description}</p>}
        {onAddToCart && (
          <Button onClick={() => onAddToCart(product)}>{ctaLabel}</Button>
        )}
      </div>
    </div>
  );
}
