import * as React from "react";

import type { SKU } from "@acme/types";

import { ProductCarousel } from "../organisms/ProductCarousel";
import { ProductGrid } from "../organisms/ProductGrid";

export interface ProductGalleryTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  products: SKU[];
  useCarousel?: boolean;
  /** Minimum items to show per row or slide */
  minItems?: number;
  /** Maximum items to show per row or slide */
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
    <ProductGrid
      products={products}
      minItems={minItems}
      maxItems={maxItems}
      className={className}
      {...props}
    />
  );
}
