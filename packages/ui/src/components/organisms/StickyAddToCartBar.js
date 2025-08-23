import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
/**
 * Sticky bottom bar showing product info and an add-to-cart button.
 */
export function StickyAddToCartBar({ product, onAddToCart, ctaLabel = "Add to cart", padding = "p-4", className, ...props }) {
    return (_jsxs("div", { className: cn("sticky right-0 bottom-0 left-0 flex items-center justify-between gap-4 border-t bg-bg shadow-md", padding, className), "data-token": "--color-bg", ...props, children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-sm", children: product.title ?? "" }), product.price != null && (_jsx(Price, { amount: product.price, className: "font-semibold" }))] }), onAddToCart && (_jsx(Button, { onClick: () => onAddToCart(product), children: ctaLabel }))] }));
}
