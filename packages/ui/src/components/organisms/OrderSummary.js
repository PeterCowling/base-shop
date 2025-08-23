// packages/ui/components/organisms/OrderSummary.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCart } from "../../hooks/useCart";
import { Price } from "../atoms/Price";
import React, { useMemo } from "react";
/**
 * Displays a breakdown of the current cart: line items, subtotal,
 * deposit, and total. When `cart` and `totals` are provided, those
 * server-validated values are rendered. Otherwise the component falls
 * back to the client-side cart context.
 */
function OrderSummary({ cart: cartProp, totals }) {
    /* ------------------------------------------------------------------
     * Cart context (used as a fallback when server data isn't provided)
     * ------------------------------------------------------------------ */
    const [cartCtx] = useCart();
    const cart = cartProp ?? cartCtx;
    /* ------------------------------------------------------------------
     * Derived values
     * ------------------------------------------------------------------ */
    const lines = useMemo(() => Object.entries(cart).map(([id, line]) => ({ id, ...line })), [cart]);
    // When totals aren't provided, compute them from the cart lines.
    const computedTotals = useMemo(() => lines.reduce((sum, line) => {
        sum.subtotal += line.sku.price * line.qty;
        sum.deposit += (line.sku.deposit ?? 0) * line.qty;
        return sum;
    }, { subtotal: 0, deposit: 0 }), [lines]);
    const subtotal = totals?.subtotal ?? computedTotals.subtotal;
    const deposit = totals?.deposit ?? computedTotals.deposit;
    const tax = totals?.tax ?? 0;
    const discount = totals?.discount ?? 0;
    const total = totals?.total ?? subtotal + deposit + tax - discount;
    /* ------------------------------------------------------------------
     * Render
     * ------------------------------------------------------------------ */
    return (_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left", children: [_jsx("th", { className: "py-2", children: "Item" }), _jsx("th", { children: "Qty" }), _jsx("th", { className: "text-right", children: "Price" })] }) }), _jsx("tbody", { children: lines.map((line) => (_jsxs("tr", { className: "border-b last:border-0", children: [_jsxs("td", { className: "py-2", children: [line.sku.title, line.size && (_jsxs("span", { className: "ml-1 text-xs text-muted", children: ["(", line.size, ")"] }))] }), _jsx("td", { children: line.qty }), _jsx("td", { className: "text-right", children: _jsx(Price, { amount: line.sku.price * line.qty }) })] }, line.id))) }), _jsxs("tfoot", { children: [_jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2", children: "Subtotal" }), _jsx("td", { className: "text-right", children: _jsx(Price, { amount: subtotal }) })] }), _jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2", children: "Deposit" }), _jsx("td", { className: "text-right", children: _jsx(Price, { amount: deposit }) })] }), totals?.tax !== undefined && (_jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2", children: "Tax" }), _jsx("td", { className: "text-right", children: _jsx(Price, { amount: tax }) })] })), totals?.discount !== undefined && (_jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2", children: "Discount" }), _jsx("td", { className: "text-right", children: _jsx(Price, { amount: -discount }) })] })), _jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2 font-semibold", children: "Total" }), _jsx("td", { className: "text-right font-semibold", children: _jsx(Price, { amount: total }) })] })] })] }));
}
export default React.memo(OrderSummary);
