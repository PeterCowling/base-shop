// apps/shop-abc/src/app/[lang]/shop/ShopClient.tsx
"use client";

import FilterBar, {
  type Filters,
  type FilterDefinition,
} from "@platform-core/src/components/shop/FilterBar";
import { ProductGrid } from "@platform-core/src/components/shop/ProductGrid";
import type { SKU } from "@acme/types";
import { useMemo, useState } from "react";

export default function ShopClient({ skus }: { skus: SKU[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const sizes = useMemo(
    () => Array.from(new Set(skus.flatMap((p) => p.sizes))).sort(),
    [skus]
  );
  const colors = useMemo(
    () => Array.from(new Set(skus.map((p) => p.slug.split("-")[0]))).sort(),
    [skus]
  );
  const defs: FilterDefinition[] = [
    { name: "size", label: "Size", type: "select", options: sizes },
    { name: "color", label: "Color", type: "select", options: colors },
    { name: "maxPrice", label: "Max Price", type: "number" },
  ];

  const visible = useMemo(() => {
    return skus.filter((p) => {
      if (filters.size && !p.sizes.includes(filters.size as string)) return false;
      if (filters.color && !p.slug.startsWith(filters.color as string)) return false;
      if (typeof filters.maxPrice === "number" && p.price > filters.maxPrice) {
        return false;
      }
      return true;
    });
  }, [filters, skus]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-4 text-3xl font-bold">Shop</h1>
      <FilterBar definitions={defs} onChange={setFilters} />
      <ProductGrid skus={visible} />
    </div>
  );
}
