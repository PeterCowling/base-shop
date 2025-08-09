import * as React from "react";
import { Product } from "../organisms/ProductCard";
import { ProductCarousel } from "../organisms/ProductCarousel";
import { ProductGrid } from "../organisms/ProductGrid";
import { cn } from "../../utils/cn";

export interface ProductGalleryTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  products: Product[];
  useCarousel?: boolean;
  itemsPerSlide?: number;
  /** Minimum number of items required to render */
  minItems?: number;
  /** Maximum number of items to render */
  maxItems?: number;
}

/**
 * Display a list of products in a grid or carousel layout.
 */
export function ProductGalleryTemplate({
  products,
  useCarousel = false,
  itemsPerSlide,
  minItems,
  maxItems,
  className,
  ...props
}: ProductGalleryTemplateProps) {
  if (useCarousel) {
    return (
      <ProductCarousel
        products={products}
        itemsPerSlide={itemsPerSlide}
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
      className={cn("sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    />
  );
}
