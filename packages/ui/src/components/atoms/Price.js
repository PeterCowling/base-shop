import { jsx as _jsx } from "react/jsx-runtime";
import { useCurrency } from "@/contexts/CurrencyContext";
import * as React from "react";
import { cn } from "../../utils/cn";
/**
 * Display formatted price. Uses selected currency from context when none is provided.
 */
export const Price = React.forwardRef(({ amount, currency, className, ...props }, ref) => {
    const [ctxCurrency] = useCurrency();
    const cur = currency ?? ctxCurrency ?? "EUR";
    const formatted = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: cur,
    }).format(amount);
    return (_jsx("span", { ref: ref, className: cn(className), ...props, children: formatted }));
});
Price.displayName = "Price";
