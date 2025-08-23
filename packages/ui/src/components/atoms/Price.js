import { jsx as _jsx } from "react/jsx-runtime";
import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";
import { formatPrice } from "@acme/shared-utils";
import * as React from "react";
import { cn } from "../../utils/style";
/**
 * Display formatted price. Uses selected currency from context when none is provided.
 */
export const Price = React.forwardRef(({ amount, currency, className, ...props }, ref) => {
    const [ctxCurrency] = useCurrency();
    const cur = currency ?? ctxCurrency ?? "EUR";
    const formatted = formatPrice(amount, cur);
    return (_jsx("span", { ref: ref, className: cn(className), ...props, children: formatted }));
});
Price.displayName = "Price";
