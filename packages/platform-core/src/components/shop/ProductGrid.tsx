// src/components/shop/ProductGrid.tsx
"use client";

import type { SKU } from "@acme/types";
import { memo, useMemo, useRef, useState, useEffect } from "react";
import { ProductCard } from "./ProductCard";

type Props = {
  skus: SKU[];
  columns?: number;
  /** Minimum number of products to display */
  minItems?: number;
  /** Maximum number of products to display */
  maxItems?: number;
  className?: string;
};

function ProductGridInner({
  skus,
  columns,
  minItems = 1,
  maxItems = 3,
  className,
}: Props) {
  // simple alphabetic sort for deterministic order (SSR/CSR match)
  const sorted = useMemo(
    () => [...skus].sort((a, b) => a.title.localeCompare(b.title)),
    [skus]
  );

  const containerRef = useRef<HTMLElement>(null);
  const [cols, setCols] = useState(columns ?? minItems);

  useEffect(() => {
    if (columns || typeof ResizeObserver === "undefined" || !containerRef.current)
      return;
    const el = containerRef.current;
    const ITEM_WIDTH = 250;
    const update = () => {
      const width = el.clientWidth;
      const ideal = Math.floor(width / ITEM_WIDTH) || 1;
      const clamped = Math.max(minItems, Math.min(maxItems, ideal));
      setCols(clamped);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns, minItems, maxItems]);

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
