import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Price } from "../atoms/Price";
import { ProductBadge } from "../atoms/ProductBadge";
/**
 * Display current price with optional compare-at price and discount badge.
 */
export const PriceCluster = React.forwardRef(({ price, compare, currency = "EUR", className, ...props }, ref) => {
    const hasDiscount = typeof compare === "number" && compare > price;
    const discount = hasDiscount
        ? Math.round(100 - (price / compare) * 100)
        : 0;
    return (_jsxs("div", { ref: ref, className: cn("flex items-baseline gap-2", className), ...props, children: [_jsx(Price, { amount: price, currency: currency, className: "font-semibold" }), hasDiscount && (_jsxs(_Fragment, { children: [_jsx(Price, { amount: compare, currency: currency, className: "text-muted-foreground text-sm line-through" }), _jsx(ProductBadge, { label: `-${discount}%`, variant: "sale" })] }))] }));
});
PriceCluster.displayName = "PriceCluster";
