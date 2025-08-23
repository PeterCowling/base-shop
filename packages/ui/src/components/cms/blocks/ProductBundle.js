import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PRODUCTS } from "@acme/platform-core/products";
import { Price } from "../../atoms/Price";
/**
 * Display a list of products with a combined bundle price.
 */
export default function ProductBundle({ skus = [], discount = 0, quantity = 1, }) {
    if (!skus.length)
        return null;
    const subtotal = skus.reduce((sum, sku) => sum + (sku.price ?? 0), 0) * quantity;
    const finalPrice = discount ? subtotal * (1 - discount / 100) : subtotal;
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("ul", { className: "space-y-2", children: skus.map((sku) => (_jsxs("li", { className: "flex items-center justify-between", children: [_jsx("span", { children: sku.title }), _jsx(Price, { amount: sku.price ?? 0 })] }, sku.id))) }), discount ? (_jsxs("div", { className: "flex items-baseline gap-2", children: [_jsx(Price, { amount: subtotal, className: "line-through text-muted-foreground" }), _jsx(Price, { amount: finalPrice, className: "font-semibold" })] })) : (_jsx(Price, { amount: finalPrice, className: "font-semibold" }))] }));
}
export function getRuntimeProps() {
    return { skus: PRODUCTS.slice(0, 2) };
}
