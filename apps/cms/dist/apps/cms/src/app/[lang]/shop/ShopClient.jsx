// src/app/[lang]/shop/ShopClient.tsx
"use client";
import FilterBar from "@/components/shop/FilterBar";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { useMemo, useState } from "react";
export default function ShopClient({ skus }) {
    const [filters, setFilters] = useState({});
    const visible = useMemo(() => {
        if (!filters.size)
            return skus;
        return skus.filter((p) => p.sizes.includes(filters.size));
    }, [filters, skus]);
    return (<div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Shop</h1>
      <FilterBar onChange={setFilters}/>
      <ProductGrid skus={visible}/>
    </div>);
}
