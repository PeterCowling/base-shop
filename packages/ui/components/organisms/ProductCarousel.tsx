import * as React from "react";
import { cn } from "../../utils/cn";
import { Product, ProductCard } from "./ProductCard";

export interface ProductCarouselProps
  extends React.HTMLAttributes<HTMLDivElement> {
  products: Product[];
  itemsPerSlide?: number;
  className?: string;
}

/**
 * Horizontally scrollable carousel for product cards.
 * Items per slide can be controlled via the `itemsPerSlide` prop.
 */
export function ProductCarousel({
  products,
  itemsPerSlide = 3,
  className,
  ...props
}: ProductCarouselProps) {
  const width = `${100 / itemsPerSlide}%`;
  return (
    <div className={cn("overflow-hidden", className)} {...props}>
      <div className="flex snap-x gap-4 overflow-x-auto pb-4">
        {products.map((p) => (
          <div
            key={p.id}
            style={{ flex: `0 0 ${width}` }}
            className="snap-start"
          >
            <ProductCard product={p} className="h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
