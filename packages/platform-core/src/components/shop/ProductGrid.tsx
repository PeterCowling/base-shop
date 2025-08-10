// src/components/shop/ProductGrid.tsx
import type { SKU } from "@types";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "./ProductCard";

type Props = { skus: SKU[]; minCols?: number; maxCols?: number };

function ProductGridInner({ skus, minCols = 1, maxCols = 3 }: Props) {
  // simple alphabetic sort for deterministic order (SSR/CSR match)
  const sorted = useMemo(
    () => [...skus].sort((a, b) => a.title.localeCompare(b.title)),
    [skus]
  );

  const containerRef = useRef<HTMLElement>(null);
  const [cols, setCols] = useState(maxCols);

  useEffect(() => {
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

  const style = {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
  } as React.CSSProperties;

  return (
    <section ref={containerRef} className="grid gap-6" style={style}>
      {sorted.map((sku) => (
        <ProductCard key={sku.id} sku={sku} />
      ))}
    </section>
  );
}

export const ProductGrid = memo(ProductGridInner);
