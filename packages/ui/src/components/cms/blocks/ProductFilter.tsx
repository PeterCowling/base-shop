"use client";

import { useState, useMemo } from "react";
import { useProductFilters } from "../../../hooks/useProductFilters";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";

type FilterSku = SKU & { id: string; title: string };

export interface FacetConfig {
  size?: boolean;
  color?: boolean;
  price?: boolean;
}

export interface ProductFilterProps {
  showSize?: boolean;
  showColor?: boolean;
  showPrice?: boolean;
  facets?: FacetConfig;
  onChange?: (state: { size?: string; color?: string; minPrice?: number; maxPrice?: number }) => void;
}

export default function ProductFilter({
  showSize = true,
  showColor = true,
  showPrice = true,
  facets,
  onChange,
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

  // URL sync (best-effort)
  const nav = (() => {
    try { return require("next/navigation"); } catch { return null; }
  })();
  const router = nav?.useRouter?.();
  const searchParams = nav?.useSearchParams?.();

  // initialize state from URL
  useMemo(() => {
    try {
      const sp = searchParams as ReturnType<typeof nav.useSearchParams>;
      if (!sp) return;
      const sz = sp.get("size");
      const co = sp.get("color");
      const minRaw = sp.get("min");
      const maxRaw = sp.get("max");
      if (sz) setSize(sz);
      if (co) setColor(co);
      if (minRaw != null) {
        const min = Number(minRaw);
        if (Number.isFinite(min)) setMinPrice(min);
      }
      if (maxRaw != null) {
        const max = Number(maxRaw);
        if (Number.isFinite(max)) setMaxPrice(max);
      }
    } catch {}
  }, []);

  const pushUrl = (patch: Record<string, string | number | undefined>) => {
    try {
      if (!router) return;
      const next = new URL(window.location.href);
      const entries = new URLSearchParams(next.search);
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") entries.delete(k);
        else entries.set(k, String(v));
      }
      next.search = entries.toString();
      router.push(next.pathname + (next.search ? `?${next.search}` : ""));
    } catch {}
  };

  const results = useMemo(() => {
    return filteredRows.filter((p) => {
      const sizeMatch = !size || p.sizes?.includes(size);
      const colorMatch = !color || p.id.includes(color);
      const price = p.price ?? 0;
      const priceMatch = price >= minPrice && price <= maxPrice;
      return sizeMatch && colorMatch && priceMatch;
    });
  }, [filteredRows, size, color, minPrice, maxPrice]);

  const eff = {
    size: facets?.size ?? showSize,
    color: facets?.color ?? showColor,
    price: facets?.price ?? showPrice,
  };

  return (
    <div className="space-y-4">
      {eff.size && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Size</label>
          <select
            value={size}
            onChange={(e) => { const v = e.target.value; setSize(v); pushUrl({ size: v }); onChange?.({ size: v, color, minPrice, maxPrice }); }}
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
      {eff.color && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Color</label>
          <select
            value={color}
            onChange={(e) => { const v = e.target.value; setColor(v); pushUrl({ color: v }); onChange?.({ size, color: v, minPrice, maxPrice }); }}
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
      {eff.price && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Price</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => { const n = Number(e.target.value); setMinPrice(n); pushUrl({ min: n }); onChange?.({ size, color, minPrice: n, maxPrice }); }}
              className="w-20 rounded border p-1 text-sm"
            />
            <span className="text-sm">-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => { const n = Number(e.target.value); setMaxPrice(n); pushUrl({ max: n }); onChange?.({ size, color, minPrice, maxPrice: n }); }}
              className="w-20 rounded border p-1 text-sm"
            />
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{results.length} products</p>
    </div>
  );
}
