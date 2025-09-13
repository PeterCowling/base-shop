"use client";

import * as React from "react";
import { cn } from "../../utils/style";
import type { SKU } from "@acme/types";
import { ProductCard } from "./ProductCard";

export interface RecommendationCarouselProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** API endpoint providing recommended products. */
  endpoint: string;
  /** Minimum number of items visible per slide. */
  minItems?: number;
  /** Maximum number of items visible per slide. */
  maxItems?: number;
  /** Items shown on desktop viewports */
  desktopItems?: number;
  /** Items shown on tablet viewports */
  tabletItems?: number;
  /** Items shown on mobile viewports */
  mobileItems?: number;
  /** Tailwind class controlling gap between slides */
  gapClassName?: string;
  /** Function to calculate individual slide width */
  getSlideWidth?: (itemsPerSlide: number) => string;
}

/**
 * Horizontally scrollable carousel that fetches product
 * recommendations from an API. The number of visible items
 * adapts to the current viewport width and is clamped between
 * the provided `minItems` and `maxItems` values.
 */
export function RecommendationCarousel({
  endpoint,
  minItems = 1,
  maxItems = 4,
  desktopItems,
  tabletItems,
  mobileItems,
  gapClassName = "gap-4",
  getSlideWidth = (n) => `${100 / n}%`,
  className,
  ...props
}: RecommendationCarouselProps) {
  const [products, setProducts] = React.useState<SKU[]>([]);
  const [itemsPerSlide, setItemsPerSlide] = React.useState(
    desktopItems ?? minItems
  );
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const autoplayRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = React.useRef(0);

  const stopAutoplay = React.useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  const startAutoplay = React.useCallback(() => {
    stopAutoplay();
    if (!scrollerRef.current || products.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      indexRef.current = (indexRef.current + 1) % products.length;
      scroller.scrollTo({
        left: scroller.clientWidth * indexRef.current,
        behavior: "smooth",
      });
    }, 3000);
  }, [products.length, stopAutoplay]);

  React.useEffect(() => {
    const calculateItems = () => {
      const width = window.innerWidth;
      if (desktopItems || tabletItems || mobileItems) {
        const chosen =
          width >= 1024
            ? desktopItems
            : width >= 768
            ? tabletItems
            : mobileItems;
        setItemsPerSlide(chosen ?? minItems);
        return;
      }
      const approxItemWidth = 320;
      const count = Math.floor(width / approxItemWidth);
      setItemsPerSlide(
        Math.min(maxItems, Math.max(minItems, count || minItems))
      );
    };
    calculateItems();
    window.addEventListener("resize", calculateItems);
    return () => window.removeEventListener("resize", calculateItems);
  }, [
    minItems,
    maxItems,
    desktopItems,
    tabletItems,
    mobileItems,
  ]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set("minItems", String(minItems));
        url.searchParams.set("maxItems", String(maxItems));
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as SKU[];
        setProducts(data);
      } catch (err) {
        console.error("Failed loading recommendations", err);
      }
    };
    void load();
  }, [endpoint, minItems, maxItems]);

  const width = getSlideWidth(itemsPerSlide);

  const slideStyle = React.useMemo<React.CSSProperties>(
    () => ({ flex: `0 0 ${width}` }),
    [width]
  );

  React.useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  if (!products.length) return null;

  return (
    <div
      className={cn("overflow-hidden", className)}
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
      {...props}
    >
      <div
      ref={scrollerRef}
        className={cn("flex snap-x overflow-x-auto pb-4", gapClassName)}
      >
        {products.map((p) => (
          <div key={p.id} style={slideStyle} className="snap-start">
            <ProductCard product={p} className="h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
