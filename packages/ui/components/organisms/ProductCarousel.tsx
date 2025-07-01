import * as React from "react";
import { cn } from "../../utils/cn";
import { Product, ProductCard } from "./ProductCard";

export interface ProductCarouselProps
  extends React.HTMLAttributes<HTMLDivElement> {
  products: Product[];
  itemsPerSlide?: number;
  /** flex gap class applied to the inner scroller */
  gapClassName?: string;
  /**
   * Function to calculate the width of each slide based on
   * the current itemsPerSlide value. Should return a CSS
   * width value such as "33.333%".
   */
  getSlideWidth?: (itemsPerSlide: number) => string;
  className?: string;
}

/**
 * Horizontally scrollable carousel for product cards.
 * Items per slide can be controlled via the `itemsPerSlide` prop.
 */
export function ProductCarousel({
  products,
  itemsPerSlide = 3,
  gapClassName = "gap-4",
  getSlideWidth = (n) => `${100 / n}%`,
  className,
  ...props
}: ProductCarouselProps) {
  const width = getSlideWidth(itemsPerSlide);
  const slideStyle = { flex: `0 0 ${width}` } as React.CSSProperties;
  return (
    <div className={cn("overflow-hidden", className)} {...props}>
      <div className={cn("flex snap-x overflow-x-auto pb-4", gapClassName)}>
        {products.map((p) => (
          <div key={p.id} style={slideStyle} className="snap-start">
            <ProductCard product={p} className="h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
