// apps/shop-abc/src/app/[lang]/shop/ShopClient.tsx
"use client";

import FilterBar, {
  Filters,
} from "@platform-core/src/components/shop/FilterBar";
import { ProductGrid } from "@platform-core/src/components/shop/ProductGrid";
import type { SKU } from "@acme/types";
import { useMemo, useState } from "react";

export default function ShopClient({ skus }: { skus: SKU[] }) {
  const [filters, setFilters] = useState<Filters>({});

  const visible = useMemo(() => {
    if (!filters.size) return skus;
    return skus.filter((p) => p.sizes.includes(filters.size!));
  }, [filters, skus]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-4 text-3xl font-bold">Shop</h1>
      <FilterBar onChange={setFilters} />
      <ProductGrid skus={visible} />
    </div>
  );
}
