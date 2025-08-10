// src/components/shop/ProductGrid.tsx
"use client";

import type { SKU } from "@types";
import { memo, useMemo, useRef, useState, useEffect } from "react";
import { ProductCard } from "./ProductCard";

type Props = {
  skus: SKU[];
  columns?: number;
  minCols?: number;
  maxCols?: number;
  className?: string;
};

function ProductGridInner({
  skus,
  columns,
  minCols = 1,
  maxCols = 3,
  className,
}: Props) {
  // simple alphabetic sort for deterministic order (SSR/CSR match)
  const sorted = useMemo(
    () => [...skus].sort((a, b) => a.title.localeCompare(b.title)),
    [skus]
  );

  const containerRef = useRef<HTMLElement>(null);
  const [cols, setCols] = useState(columns ?? minCols);

  useEffect(() => {
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

  return (
    <section
      ref={containerRef}
      className={`grid gap-6 ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(${columns ?? cols}, minmax(0, 1fr))` }}
    >
      {sorted.map((sku) => (
        <ProductCard key={sku.id} sku={sku} />
      ))}
    </section>
  );
}

export const ProductGrid = memo(ProductGridInner);
