import * as React from "react";
import { cn } from "../../utils/cn";
import { Product, ProductCard } from "../organisms/ProductCard";
import { ProductCarousel } from "../organisms/ProductCarousel";

export interface ProductGalleryTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  products: Product[];
  useCarousel?: boolean;
  minItemsPerSlide?: number;
  maxItemsPerSlide?: number;
}

/**
 * Display a list of products in a grid or carousel layout. When
 * `useCarousel` is true, the number of visible items adapts to
 * screen size within the provided min/max bounds.
*/
export function ProductGalleryTemplate({
  products,
  useCarousel = false,
  minItemsPerSlide,
  maxItemsPerSlide,
  className,
  ...props
}: ProductGalleryTemplateProps) {
  if (useCarousel) {
    return (
      <ProductCarousel
        products={products}
        minItemsPerSlide={minItemsPerSlide}
        maxItemsPerSlide={maxItemsPerSlide}
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
