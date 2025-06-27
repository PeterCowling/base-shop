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
}

export function ProductGrid({
  products,
  columns = 3,
  showImage = true,
  showPrice = true,
  ctaLabel = "Add to cart",
  onAddToCart,
  className,
  ...props
}: ProductGridProps) {
  const style = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  } as React.CSSProperties;
  return (
    <div className={cn("grid gap-6", className)} style={style} {...props}>
      {products.map((p) => (
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
