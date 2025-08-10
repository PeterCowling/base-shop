import * as React from "react";
import { cn } from "../../utils/cn";
import { Product, ProductCard } from "./ProductCard";

export interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: Product[];
  /** Minimum number of columns to render */
  minCols?: number;
  /** Maximum number of columns to render */
  maxCols?: number;
  showImage?: boolean;
  showPrice?: boolean;
  ctaLabel?: string;
  onAddToCart?: (product: Product) => void;
}

export function ProductGrid({
  products,
  minCols = 3,
  maxCols = 3,
  showImage = true,
  showPrice = true,
  ctaLabel = "Add to cart",
  onAddToCart,
  className,
  ...props
}: ProductGridProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cols, setCols] = React.useState(maxCols);

  React.useEffect(() => {
    function updateColumns() {
      const width = containerRef.current?.clientWidth ?? window.innerWidth;
      const calculated = Math.floor(width / 250) || 1;
      const clamped = Math.min(maxCols, Math.max(minCols, calculated));
      setCols(clamped);
    }

    updateColumns();

    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      const ro = new ResizeObserver(updateColumns);
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }

    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [minCols, maxCols]);

  const style = React.useMemo(
    () => ({ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }),
    [cols]
  );

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
