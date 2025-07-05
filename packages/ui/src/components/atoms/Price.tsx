import { useCurrency } from "@platform-core/src/contexts/CurrencyContext";
import * as React from "react";
import { cn } from "../../utils/cn";

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
    const formatted = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
    }).format(amount);

    return (
      <span ref={ref} className={cn(className)} {...props}>
        {formatted}
      </span>
    );
  }
);
Price.displayName = "Price";
