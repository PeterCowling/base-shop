import * as React from "react";
import { cn } from "../../utils/cn";
import { Product, ProductCard } from "./ProductCard";

export interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: Product[];
  columns?: number;
  showImage?: boolean;
  showPrice?: boolean;
  ctaLabel?: string;
  onAddToCart?: (product: Product) => void;
  /** Minimum number of items required to render */
  minItems?: number;
  /** Maximum number of items to render */
  maxItems?: number;
}

export function ProductGrid({
  products,
  columns,
  showImage = true,
  showPrice = true,
  ctaLabel = "Add to cart",
  onAddToCart,
  minItems,
  maxItems,
  className,
  ...props
}: ProductGridProps) {
  const visible = maxItems ? products.slice(0, maxItems) : products;
  if (minItems !== undefined && visible.length < minItems) {
    return null;
  }
  const style = columns
    ? ({ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } as React.CSSProperties)
    : undefined;
  return (
    <div className={cn("grid gap-6", className)} style={style} {...props}>
      {visible.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          onAddToCart={onAddToCart}
          showImage={showImage}
          showPrice={showPrice}
          ctaLabel={ctaLabel}
        />
      ))}
    </div>
  );
}
