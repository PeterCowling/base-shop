import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { ProductCard } from "../organisms/ProductCard";
/**
 * Display multiple products side by side for comparison.
 */
export function ProductComparisonTemplate({ products, className, ...props }) {
    return (_jsx("div", { className: cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className), ...props, children: products.map((p) => (_jsx(ProductCard, { product: p }, p.id))) }));
}
