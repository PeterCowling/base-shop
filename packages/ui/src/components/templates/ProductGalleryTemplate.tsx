import * as React from "react";
import { Product } from "../organisms/ProductCard";
import { ProductCarousel } from "../organisms/ProductCarousel";
import { ProductGrid } from "../organisms/ProductGrid";

export interface ProductGalleryTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  products: Product[];
  useCarousel?: boolean;
  /** Minimum columns to show per row or slide */
  minCols?: number;
  /** Maximum columns to show per row or slide */
  maxCols?: number;
}

/**
 * Display a list of products in a grid or carousel layout.
 */
export function ProductGalleryTemplate({
  products,
  useCarousel = false,
  minCols,
  maxCols,
  className,
  ...props
}: ProductGalleryTemplateProps) {
  if (useCarousel) {
    return (
      <ProductCarousel
        products={products}
        minItems={minCols}
        maxItems={maxCols}
        className={className}
        {...props}
      />
    );
  }
  return (
    <ProductGrid
      products={products}
      minCols={minCols}
      maxCols={maxCols}
      className={className}
      {...props}
    />
  );
}
