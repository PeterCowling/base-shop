// apps/shop-bcd/src/app/[lang]/shop/ShopClient.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import FilterBar from "@/components/shop/FilterBar";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { useMemo, useState } from "react";
export default function ShopClient({ skus }) {
    const [filters, setFilters] = useState({});
    const sizes = useMemo(() => Array.from(new Set(skus.flatMap((p) => p.sizes))).sort(), [skus]);
    const visible = useMemo(() => {
        if (!filters.size)
            return skus;
        return skus.filter((p) => p.sizes.includes(filters.size));
    }, [filters, skus]);
    return (_jsxs("div", { className: "mx-auto max-w-6xl px-4 py-10", children: [_jsx("h1", { className: "mb-4 text-3xl font-bold", children: "Shop" }), _jsx(FilterBar, { onChange: setFilters, sizes: sizes }), _jsx(ProductGrid, { skus: visible })] }));
}
