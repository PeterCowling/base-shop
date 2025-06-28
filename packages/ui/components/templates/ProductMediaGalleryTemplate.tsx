import * as React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../atoms-shim";
import { Price } from "../atoms/Price";
import { ProductBadge } from "../atoms/ProductBadge";
import type { MediaItem } from "../molecules/MediaSelector";
import type { Product } from "../organisms/ProductCard";
import { ProductGallery } from "../organisms/ProductGallery";

export interface ProductMediaGalleryTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  product: Product & {
    media: MediaItem[];
    description?: string;
    badges?: { label: string; variant?: "default" | "sale" | "new" }[];
  };
  onAddToCart?: (product: Product) => void;
  ctaLabel?: string;
}

export function ProductMediaGalleryTemplate({
  product,
  onAddToCart,
  ctaLabel = "Add to cart",
  className,
  ...props
}: ProductMediaGalleryTemplateProps) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)} {...props}>
      <ProductGallery media={product.media} />
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">{product.title}</h2>
        {product.badges && (
          <div className="flex gap-2">
            {product.badges.map((b, idx) => (
              <ProductBadge key={idx} label={b.label} variant={b.variant} />
            ))}
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
