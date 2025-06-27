import * as React from "react";
import { cn } from "../../utils/cn";

export interface StockStatusProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  inStock: boolean;
  labelInStock?: string;
  labelOutOfStock?: string;
}

export const StockStatus = React.forwardRef<HTMLSpanElement, StockStatusProps>(
  (
    {
      inStock,
      labelInStock = "In stock",
      labelOutOfStock = "Out of stock",
      className,
      ...props
    },
    ref
  ) => {
    const color = inStock ? "text-green-600" : "text-red-600";
    return (
      <span
        ref={ref}
        className={cn("text-sm font-medium", color, className)}
        {...props}
      >
        {inStock ? labelInStock : labelOutOfStock}
      </span>
    );
  }
);
StockStatus.displayName = "StockStatus";
