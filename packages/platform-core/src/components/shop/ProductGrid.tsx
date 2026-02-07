// src/components/shop/ProductGrid.tsx
"use client";

import {
  type HTMLAttributes,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { SKU } from "@acme/types";

import { ProductCard } from "./ProductCard";

type Props = {
  skus: SKU[];
  columns?: number;
  /** Minimum number of products to display */
  minItems?: number;
  /** Maximum number of products to display */
  maxItems?: number;
  /** Items shown on desktop viewports */
  desktopItems?: number;
  /** Items shown on tablet viewports */
  tabletItems?: number;
  /** Items shown on mobile viewports */
  mobileItems?: number;
  className?: string;
} & HTMLAttributes<HTMLElement>;

function ProductGridInner({
  skus,
  columns,
  minItems = 1,
  maxItems = 3,
  desktopItems,
  tabletItems,
  mobileItems,
  className,
  ...rest
}: Props) {
  // simple alphabetic sort for deterministic order (SSR/CSR match)
  const sorted = useMemo(
    () => [...skus].sort((a, b) => a.title.localeCompare(b.title)),
    [skus]
  );

  const containerRef = useRef<HTMLElement>(null);
  const [cols, setCols] = useState(columns ?? desktopItems ?? minItems);

  useEffect(() => {
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

  return (
    <section
      ref={containerRef}
      {...rest}
      className={`grid gap-6 ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(${columns ?? cols}, minmax(0, 1fr))` }}
    >
      {sorted.length
        ? sorted.map((sku) => <ProductCard key={sku.id} sku={sku} />)
        : Array.from({ length: columns ?? cols }).map((_, i) => (
            <div
              key={i}
              data-cy="placeholder"
              className="h-64 rounded-lg bg-gray-200 animate-pulse"
            />
          ))}
    </section>
  );
}

export const ProductGrid = memo(ProductGridInner);
