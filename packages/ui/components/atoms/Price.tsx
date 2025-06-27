import * as React from "react";
import { cn } from "../../utils/cn";

export interface PriceProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number;
  currency?: string;
}

/**
 * Display formatted price. Pass `currency` ISO code or defaults to EUR.
 */
export const Price = React.forwardRef<HTMLSpanElement, PriceProps>(
  ({ amount, currency = "EUR", className, ...props }, ref) => {
    const formatted = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);

    return (
      <span ref={ref} className={cn(className)} {...props}>
        {formatted}
      </span>
    );
  }
);
Price.displayName = "Price";
