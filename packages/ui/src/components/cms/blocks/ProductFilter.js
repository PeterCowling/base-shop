"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useProductFilters } from "../../../hooks/useProductFilters";
import { PRODUCTS } from "@acme/platform-core/products";
export default function ProductFilter({ showSize = true, showColor = true, showPrice = true, }) {
    const { filteredRows } = useProductFilters(PRODUCTS);
    const sizes = useMemo(() => {
        const s = new Set();
        filteredRows.forEach((p) => p.sizes?.forEach((sz) => s.add(sz)));
        return Array.from(s).sort();
    }, [filteredRows]);
    const colors = useMemo(() => {
        const s = new Set();
        filteredRows.forEach((p) => {
            const c = p.id.split("-")[0];
            if (c)
                s.add(c);
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
    return (_jsxs("div", { className: "space-y-4", children: [showSize && (_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-sm font-medium", children: "Size" }), _jsxs("select", { value: size, onChange: (e) => setSize(e.target.value), className: "w-full rounded border p-2 text-sm", children: [_jsx("option", { value: "", children: "All" }), sizes.map((s) => (_jsx("option", { value: s, children: s }, s)))] })] })), showColor && (_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-sm font-medium", children: "Color" }), _jsxs("select", { value: color, onChange: (e) => setColor(e.target.value), className: "w-full rounded border p-2 text-sm", children: [_jsx("option", { value: "", children: "All" }), colors.map((c) => (_jsx("option", { value: c, children: c }, c)))] })] })), showPrice && (_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-sm font-medium", children: "Price" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "number", value: minPrice, onChange: (e) => setMinPrice(Number(e.target.value)), className: "w-20 rounded border p-1 text-sm" }), _jsx("span", { className: "text-sm", children: "-" }), _jsx("input", { type: "number", value: maxPrice, onChange: (e) => setMaxPrice(Number(e.target.value)), className: "w-20 rounded border p-1 text-sm" })] })] })), _jsxs("p", { className: "text-xs text-muted-foreground", children: [results.length, " products"] })] }));
}
