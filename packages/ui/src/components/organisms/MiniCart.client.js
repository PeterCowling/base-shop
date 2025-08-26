"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCart } from "@acme/platform-core/contexts/CartContext";
import * as React from "react";
import { cn } from "../../utils/style";
import { drawerWidthProps } from "../../utils/style/drawerWidth";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { Toast } from "../atoms/Toast";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, } from "../atoms/primitives/dialog";
export function MiniCart({ trigger, width = "w-80" }) {
    const [cart, dispatch] = useCart();
    const [toast, setToast] = React.useState({ open: false, message: "" });
    const lines = Object.entries(cart).map(([id, line]) => ({ id, ...line }));
    const subtotal = lines.reduce((s, l) => s + l.sku.price * l.qty, 0);
    const { widthClass, style } = drawerWidthProps(width);
    const handleRemove = async (id) => {
        try {
            await dispatch({ type: "remove", id });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update cart";
            setToast({ open: true, message });
        }
    };
    const handleQty = async (id, qty) => {
        try {
            await dispatch({ type: "setQty", id, qty });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update cart";
            setToast({ open: true, message });
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: trigger }), _jsxs(DialogContent, { style: style, className: cn("bg-background fixed top-0 right-0 h-full max-w-full rounded-none border-l p-6 shadow-lg", widthClass), children: [_jsx(DialogTitle, { className: "mb-4", children: "Your Cart" }), _jsx(DialogDescription, { className: "sr-only", children: "Review items in your cart" }), lines.length === 0 ? (_jsx("p", { className: "text-muted-foreground text-sm", children: "Cart is empty." })) : (_jsxs("div", { className: "flex h-full flex-col gap-4", children: [_jsx("ul", { className: "grow space-y-3 overflow-y-auto", children: lines.map((line) => (_jsxs("li", { className: "flex items-center justify-between gap-2", children: [_jsxs("span", { className: "text-sm", children: [line.sku.title, line.size && (_jsxs("span", { className: "ml-1 text-muted", children: ["(", line.size, ")"] }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { onClick: () => void handleQty(line.id, line.qty - 1), className: "px-2 py-1 text-xs", "aria-label": "Decrease quantity", children: "-" }), _jsx("span", { className: "text-sm", children: line.qty }), _jsx(Button, { onClick: () => void handleQty(line.id, line.qty + 1), className: "px-2 py-1 text-xs", "aria-label": "Increase quantity", children: "+" })] }), _jsx(Button, { variant: "destructive", onClick: () => void handleRemove(line.id), className: "px-2 py-1 text-xs", children: "Remove" })] }, line.id))) }), _jsx("div", { className: "border-t pt-4 text-sm", children: _jsxs("div", { className: "flex justify-between font-semibold", children: [_jsx("span", { children: "Subtotal" }), _jsx(Price, { amount: subtotal })] }) })] }))] })] }), _jsx(Toast, { open: toast.open, onClose: () => setToast((t) => ({ ...t, open: false })), message: toast.message })] }));
}
