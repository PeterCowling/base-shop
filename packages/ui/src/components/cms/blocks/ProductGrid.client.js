"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { ProductGrid as BaseGrid } from "@/components/shop/ProductGrid";
import { PRODUCTS } from "@/lib/products";
export default function ProductGrid() {
    return _jsx(BaseGrid, { skus: PRODUCTS });
}
