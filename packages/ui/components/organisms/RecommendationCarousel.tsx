"use client";

import * as React from "react";
import { cn } from "../../utils/cn";
import { Product, ProductCard } from "./ProductCard";

export interface RecommendationCarouselProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** API endpoint providing recommended products. */
  endpoint: string;
  /** Number of items visible per slide. */
  itemsPerSlide?: number;
  /** Tailwind class controlling gap between slides */
  gapClassName?: string;
  /** Function to calculate individual slide width */
  getSlideWidth?: (itemsPerSlide: number) => string;
}

/**
 * Horizontally scrollable carousel that fetches product
 * recommendations from an API.
 */
export function RecommendationCarousel({
  endpoint,
  itemsPerSlide = 3,
  gapClassName = "gap-4",
  getSlideWidth = (n) => `${100 / n}%`,
  className,
  ...props
}: RecommendationCarouselProps) {
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) return;
        const data = (await res.json()) as Product[];
        setProducts(data);
      } catch (err) {
        console.error("Failed loading recommendations", err);
      }
    };
    void load();
  }, [endpoint]);

  const width = getSlideWidth(itemsPerSlide);

  const slideStyle = React.useMemo<React.CSSProperties>(
    () => ({ flex: `0 0 ${width}` }),
    [width]
  );

  if (!products.length) return null;

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
