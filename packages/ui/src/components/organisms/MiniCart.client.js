"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCart } from "@/contexts/CartContext";
import { cn } from "../../utils/cn";
import { drawerWidthProps } from "../../utils/drawerWidth";
import { Button } from "../atoms-shadcn";
import { Price } from "../atoms/Price";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, } from "../ui/dialog";
export function MiniCart({ trigger, width = "w-80" }) {
    const [cart, dispatch] = useCart();
    const lines = Object.values(cart);
    const subtotal = lines.reduce((s, l) => s + l.sku.price * l.qty, 0);
    const { widthClass, style } = drawerWidthProps(width);
    return (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: trigger }), _jsxs(DialogContent, { style: style, className: cn("bg-background fixed top-0 right-0 h-full max-w-full rounded-none border-l p-6 shadow-lg", widthClass), children: [_jsx(DialogTitle, { className: "mb-4", children: "Your Cart" }), lines.length === 0 ? (_jsx("p", { className: "text-muted-foreground text-sm", children: "Cart is empty." })) : (_jsxs("div", { className: "flex h-full flex-col gap-4", children: [_jsx("ul", { className: "grow space-y-3 overflow-y-auto", children: lines.map((line) => (_jsxs("li", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-sm", children: line.sku.title }), _jsxs("span", { className: "text-sm", children: ["\u00D7 ", line.qty] }), _jsx(Button, { variant: "destructive", onClick: () => dispatch({ type: "remove", id: line.sku.id }), className: "px-2 py-1 text-xs", children: "Remove" })] }, line.sku.id))) }), _jsx("div", { className: "border-t pt-4 text-sm", children: _jsxs("div", { className: "flex justify-between font-semibold", children: [_jsx("span", { children: "Subtotal" }), _jsx(Price, { amount: subtotal })] }) })] }))] })] }));
}
