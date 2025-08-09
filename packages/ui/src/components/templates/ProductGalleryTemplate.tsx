import * as React from "react";
import { cn } from "../../utils/cn";
import { Product, ProductCard } from "../organisms/ProductCard";
import { ProductCarousel } from "../organisms/ProductCarousel";

export interface ProductGalleryTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  products: Product[];
  useCarousel?: boolean;
  /** Minimum items to show when using the carousel */
  minItems?: number;
  /** Maximum items to show when using the carousel */
  maxItems?: number;
}

/**
 * Display a list of products in a grid or carousel layout.
 */
export function ProductGalleryTemplate({
  products,
  useCarousel = false,
  minItems,
  maxItems,
  className,
  ...props
}: ProductGalleryTemplateProps) {
  if (useCarousel) {
    return (
      <ProductCarousel
        products={products}
        minItems={minItems}
        maxItems={maxItems}
        className={className}
        {...props}
      />
    );
  }
  return (
    <div
      className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
