import * as React from "react";
// Force rebuild to sync with platform-core useCurrency export

import { formatPrice } from "@acme/lib/format";
import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";

import { cn } from "../../utils/style";

export interface PriceProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number;
  currency?: string;
}

/**
 * Display formatted price. Uses selected currency from context when none is provided.
 */
export const Price = React.forwardRef<HTMLSpanElement, PriceProps>(
  ({ amount, currency, className, ...props }, ref) => {
    const [ctxCurrency] = useCurrency();
    const cur = currency ?? ctxCurrency ?? "EUR";
    const formatted = formatPrice(amount, cur);

    return (
      <span ref={ref} className={cn(className)} {...props}>
        {formatted}
      </span>
    );
  }
);
Price.displayName = "Price";
