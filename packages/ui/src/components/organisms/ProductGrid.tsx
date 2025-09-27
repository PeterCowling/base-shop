"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { ProductQuickView } from "../overlays/ProductQuickView";
import type { SKU } from "@acme/types";
import { ProductCard } from "./ProductCard";

export type Product = SKU;

export interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: SKU[];
  /**
   * Explicit number of columns. If omitted, the grid will
   * determine a responsive column count within the
   * `minItems`/`maxItems` range based on its width.
   */
  columns?: number;
  /** Minimum number of items to show */
  minItems?: number;
  /** Maximum number of items to show */
  maxItems?: number;
  /** Items shown on desktop viewports */
  desktopItems?: number;
  /** Items shown on tablet viewports */
  tabletItems?: number;
  /** Items shown on mobile viewports */
  mobileItems?: number;
  showImage?: boolean;
  showPrice?: boolean;
  ctaLabel?: string;
  onAddToCart?: (product: SKU) => void;
  /** Show quick view trigger for each product */
  enableQuickView?: boolean;
}

export function ProductGrid({
  products,
  columns,
  minItems = 1,
  maxItems = 4,
  desktopItems,
  tabletItems,
  mobileItems,
  showImage = true,
  showPrice = true,
  ctaLabel = "Add to cart",
  onAddToCart,
  enableQuickView = false,
  className,
  ...props
}: ProductGridProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cols, setCols] = React.useState(
    columns ?? desktopItems ?? minItems
  );
  const [quickViewProduct, setQuickViewProduct] = React.useState<SKU | null>(
    null
  );

  React.useEffect(() => {
    if (columns || typeof ResizeObserver === "undefined" || !containerRef.current)
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
        setCols(chosen ?? minItems);
        return;
      }
      const ideal = Math.floor(width / ITEM_WIDTH) || 1;
      const clamped = Math.max(minItems, Math.min(maxItems, ideal));
      setCols(clamped);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    columns,
    minItems,
    maxItems,
    desktopItems,
    tabletItems,
    mobileItems,
  ]);

  const style = {
    gridTemplateColumns: `repeat(${columns ?? cols}, minmax(0, 1fr))`,
  } as React.CSSProperties;
  return (
    <>
      <div
        ref={containerRef}
        className={cn("grid gap-6", className)}
        style={style}
        {...props}
      >
        {products.map((p) => (
          <div key={p.id} className="relative">
            <ProductCard
              product={p}
              onAddToCart={onAddToCart}
              showImage={showImage}
              showPrice={showPrice}
              ctaLabel={ctaLabel}
            />
            {enableQuickView && (
              <Button
                variant="outline"
                className="absolute end-2 top-2 h-8 px-2"
                aria-label={`Quick view ${p.title}`}
                onClick={() => setQuickViewProduct(p)}
              >
                Quick View
              </Button>
            )}
          </div>
        ))}
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
