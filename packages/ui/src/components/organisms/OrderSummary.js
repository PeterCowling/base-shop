// packages/ui/components/organisms/OrderSummary.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCart } from "@ui";
import React, { useMemo } from "react";
/**
 * Displays a breakdown of the current cart: line items, subtotal,
 * deposit, and total. Totals are memoised so they’re only recalculated
 * when the cart changes.
 */
function OrderSummary() {
    /* ------------------------------------------------------------------
     * Cart context
     * ------------------------------------------------------------------ */
    const [cart] = useCart();
    /* ------------------------------------------------------------------
     * Derived values
     * ------------------------------------------------------------------ */
    const lines = useMemo(() => Object.values(cart), [cart]);
    const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.sku.price * line.qty, 0), [lines]);
    const deposit = useMemo(() => lines.reduce((sum, line) => sum + (line.sku.deposit ?? 0) * line.qty, 0), [lines]);
    /* ------------------------------------------------------------------
     * Render
     * ------------------------------------------------------------------ */
    return (_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left", children: [_jsx("th", { className: "py-2", children: "Item" }), _jsx("th", { children: "Qty" }), _jsx("th", { className: "text-right", children: "Price" })] }) }), _jsx("tbody", { children: lines.map((line) => (_jsxs("tr", { className: "border-b last:border-0", children: [_jsxs("td", { className: "py-2", children: [line.sku.title, line.size && (_jsxs("span", { className: "ml-1 text-xs text-gray-500", children: ["(", line.size, ")"] }))] }), _jsx("td", { children: line.qty }), _jsxs("td", { className: "text-right", children: ["\u20AC", line.sku.price * line.qty] })] }, line.sku.id))) }), _jsxs("tfoot", { children: [_jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2", children: "Deposit" }), _jsxs("td", { className: "text-right", children: ["\u20AC", deposit] })] }), _jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2 font-semibold", children: "Total" }), _jsxs("td", { className: "text-right font-semibold", children: ["\u20AC", subtotal + deposit] })] })] })] }));
}
export default React.memo(OrderSummary);
