"use client";

import * as React from "react";
import { PRODUCTS } from "@acme/platform-core/products";
import type { SKU } from "@acme/types";
import { ProductCard } from "../../organisms/ProductCard";

export interface CrossSellRules {
  seedId?: string;
  includeForRental?: boolean;
  onlyInStock?: boolean;
  maxItems?: number;
}

export interface CrossSellSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  rules?: CrossSellRules;
  layout?: "grid" | "carousel";
}

export default function CrossSellSection({ rules = {}, layout = "grid", className, ...rest }: CrossSellSectionProps) {
  const { seedId, includeForRental = true, onlyInStock = true, maxItems = 8 } = rules;
  let pool = [...PRODUCTS] as SKU[];
  if (seedId) pool = pool.filter((p) => p.id !== seedId);
  if (!includeForRental) pool = pool.filter((p) => !p.forRental);
  if (onlyInStock) pool = pool.filter((p) => (p.stock ?? 0) > 0);
  const items = pool.slice(0, Math.max(1, Math.min(24, maxItems)));

  if (!items.length) return null;

  if (layout === "grid") {
    return (
      <section className={className} {...rest}>
        <div className="mx-auto max-w-7xl px-4">
          <h3 className="mb-4 text-lg font-semibold">You may also like</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    );
  }
  // Carousel fallback: simple horizontal scroll
  return (
    <section className={className} {...rest}>
      <div className="mx-auto max-w-7xl px-4">
        <h3 className="mb-4 text-lg font-semibold">You may also like</h3>
        <div className="flex snap-x gap-4 overflow-x-auto pb-4">
          {items.map((p) => (
            <div key={p.id} className="snap-start" style={{ flex: "0 0 280px" }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

