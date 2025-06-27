import * as React from "react";
import { cn } from "../../utils/cn";
import { Price } from "../atoms/Price";
import { ProductBadge } from "../atoms/ProductBadge";

export interface PriceClusterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  price: number;
  compare?: number;
  currency?: string;
}

/**
 * Display current price with optional compare-at price and discount badge.
 */
export const PriceCluster = React.forwardRef<HTMLDivElement, PriceClusterProps>(
  ({ price, compare, currency = "EUR", className, ...props }, ref) => {
    const hasDiscount = typeof compare === "number" && compare > price;
    const discount = hasDiscount
      ? Math.round(100 - (price / compare) * 100)
      : 0;

    return (
      <div
        ref={ref}
        className={cn("flex items-baseline gap-2", className)}
        {...props}
      >
        <Price amount={price} currency={currency} className="font-semibold" />
        {hasDiscount && (
          <>
            <Price
              amount={compare!}
              currency={currency}
              className="text-muted-foreground text-sm line-through"
            />
            <ProductBadge label={`-${discount}%`} variant="sale" />
          </>
        )}
      </div>
    );
  }
);
PriceCluster.displayName = "PriceCluster";
