import * as React from "react";
import { cn } from "../../utils/cn";
import { Product, ProductCard } from "./ProductCard";

export interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: Product[];
  /**
   * Explicit number of columns. If omitted, the grid will
   * determine a responsive column count within the
   * `minCols`/`maxCols` range based on its width.
   */
  columns?: number;
  /** Minimum number of columns to show */
  minCols?: number;
  /** Maximum number of columns to show */
  maxCols?: number;
  showImage?: boolean;
  showPrice?: boolean;
  ctaLabel?: string;
  onAddToCart?: (product: Product) => void;
}

export function ProductGrid({
  products,
  columns,
  minCols = 1,
  maxCols = 4,
  showImage = true,
  showPrice = true,
  ctaLabel = "Add to cart",
  onAddToCart,
  className,
  ...props
}: ProductGridProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cols, setCols] = React.useState(columns ?? minCols);

  React.useEffect(() => {
    if (columns || typeof ResizeObserver === "undefined" || !containerRef.current)
      return;
    const el = containerRef.current;
    const ITEM_WIDTH = 250;
    const update = () => {
      const width = el.clientWidth;
      const ideal = Math.floor(width / ITEM_WIDTH) || 1;
      const clamped = Math.max(minCols, Math.min(maxCols, ideal));
      setCols(clamped);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns, minCols, maxCols]);

  const style = {
    gridTemplateColumns: `repeat(${columns ?? cols}, minmax(0, 1fr))`,
  } as React.CSSProperties;
  return (
    <div
      ref={containerRef}
      className={cn("grid gap-6", className)}
      style={style}
      {...props}
    >
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          onAddToCart={onAddToCart}
          showImage={showImage}
          showPrice={showPrice}
          ctaLabel={ctaLabel}
        />
      ))}
    </div>
  );
}
