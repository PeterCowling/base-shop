"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { ProductQuickView } from "../overlays/ProductQuickView";
import type { SKU } from "@acme/types";
import { ProductCard } from "./ProductCard";

export type Product = SKU;

export interface ProductCarouselProps
  extends React.HTMLAttributes<HTMLDivElement> {
  products: SKU[];
  /** Minimum number of items to show at once */
  minItems?: number;
  /** Maximum number of items to show at once */
  maxItems?: number;
  /** Items shown on desktop viewports */
  desktopItems?: number;
  /** Items shown on tablet viewports */
  tabletItems?: number;
  /** Items shown on mobile viewports */
  mobileItems?: number;
  /** flex gap class applied to the inner scroller */
  gapClassName?: string;
  /**
   * Function to calculate the width of each slide based on
   * the current itemsPerSlide value. Should return a CSS
   * width value such as "33.333%".
   */
  getSlideWidth?: (itemsPerSlide: number) => string;
  className?: string;
  /** Show quick view trigger for each item */
  enableQuickView?: boolean;
  onAddToCart?: (product: SKU) => void;
}

/**
 * Horizontally scrollable carousel for product cards.
 * The number of items per slide adapts to the component width
 * and stays within the provided `minItems`/`maxItems` range.
 */
export function ProductCarousel({
  products,
  minItems = 1,
  maxItems = 5,
  desktopItems,
  tabletItems,
  mobileItems,
  gapClassName = "gap-4",
  getSlideWidth = (n) => `${100 / n}%`,
  className,
  enableQuickView = false,
  onAddToCart,
  ...props
}: ProductCarouselProps) {
  if (!products.length) return null;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [itemsPerSlide, setItemsPerSlide] = React.useState(
    desktopItems ?? minItems
  );
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [quickViewProduct, setQuickViewProduct] = React.useState<SKU | null>(
    null
  );

  const prev = () =>
    setCurrentIndex((i) => (i - 1 + products.length) % products.length);
  const next = () =>
    setCurrentIndex((i) => (i + 1) % products.length);

  React.useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined")
      return;
    const el = containerRef.current;
    const ITEM_WIDTH = 250;
    const update = () => {
      const width = el.clientWidth;
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
      const ideal = Math.floor(width / ITEM_WIDTH) || 1;
      const clamped = Math.max(minItems, Math.min(maxItems, ideal));
      setItemsPerSlide(clamped);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    minItems,
    maxItems,
    desktopItems,
    tabletItems,
    mobileItems,
  ]);

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo?.({
      left: scroller.clientWidth * currentIndex,
      behavior: "smooth",
    });
  }, [currentIndex]);

  const width = getSlideWidth(itemsPerSlide);
  const slideStyle = { flex: `0 0 ${width}` } as React.CSSProperties;
  return (
    <>
      <div
        ref={containerRef}
        className={cn("overflow-hidden", className)}
        {...props}
      >
        <Button aria-label="Previous" onClick={prev} />
        <div
          ref={scrollerRef}
          className={cn("flex snap-x overflow-x-auto pb-4", gapClassName)}
        >
          {products.map((p) => (
            <div
              key={p.id}
              style={slideStyle}
              className="relative snap-start"
            >
              <ProductCard product={p} className="h-full" />
              {enableQuickView && (
                <Button
                  variant="outline"
                  className="absolute right-2 top-2 px-2 py-1 text-xs"
                  aria-label={`Quick view ${p.title}`}
                  onClick={() => setQuickViewProduct(p)}
                >
                  Quick View
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button aria-label="Next" onClick={next} />
      </div>
      {enableQuickView && quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          open={!!quickViewProduct}
          onOpenChange={(o) => !o && setQuickViewProduct(null)}
          container={containerRef.current}
          onAddToCart={onAddToCart}
        />
      )}
    </>
  );
}
