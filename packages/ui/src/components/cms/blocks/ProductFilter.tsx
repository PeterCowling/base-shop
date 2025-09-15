"use client";

import { useState, useMemo } from "react";
import { useProductFilters } from "../../../hooks/useProductFilters";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";

type FilterSku = SKU & { id: string; title: string };

export interface ProductFilterProps {
  showSize?: boolean;
  showColor?: boolean;
  showPrice?: boolean;
}

export default function ProductFilter({
  showSize = true,
  showColor = true,
  showPrice = true,
}: ProductFilterProps) {
  const { filteredRows } = useProductFilters<FilterSku>(
    PRODUCTS as FilterSku[],
  );

  const sizes = useMemo(() => {
    const s = new Set<string>();
    filteredRows.forEach((p) => p.sizes?.forEach((sz: string) => s.add(sz)));
    return Array.from(s).sort();
  }, [filteredRows]);

  const colors = useMemo(() => {
    const s = new Set<string>();
    filteredRows.forEach((p) => {
      const c = p.id.split("-")[0];
      if (c) s.add(c);
    });
    return Array.from(s).sort();
  }, [filteredRows]);

  const priceBounds = useMemo(() => {
    const prices = filteredRows.map((p) => p.price ?? 0);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    return [min, max];
  }, [filteredRows]);

  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState(priceBounds[0]);
  const [maxPrice, setMaxPrice] = useState(priceBounds[1]);

  const results = useMemo(() => {
    return filteredRows.filter((p) => {
      const sizeMatch = !size || p.sizes?.includes(size);
      const colorMatch = !color || p.id.includes(color);
      const price = p.price ?? 0;
      const priceMatch = price >= minPrice && price <= maxPrice;
      return sizeMatch && colorMatch && priceMatch;
    });
  }, [filteredRows, size, color, minPrice, maxPrice]);

  return (
    <div className="space-y-4">
      {showSize && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full rounded border p-2 text-sm"
          >
            <option value="">All</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
      {showColor && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Color</label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full rounded border p-2 text-sm"
          >
            <option value="">All</option>
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}
      {showPrice && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Price</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
              className="w-20 rounded border p-1 text-sm"
            />
            <span className="text-sm">-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-20 rounded border p-1 text-sm"
            />
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{results.length} products</p>
    </div>
  );
}

