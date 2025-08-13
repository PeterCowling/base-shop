import * as React from "react";
import { cn } from "../../utils/style";

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
    const color = inStock ? "text-success" : "text-danger";
    const token = inStock ? "--color-success" : "--color-danger";
    return (
      <span
        ref={ref}
        className={cn("text-sm font-medium", color, className)}
        data-token={token}
        {...props}
      >
        {inStock ? labelInStock : labelOutOfStock}
      </span>
    );
  }
);
StockStatus.displayName = "StockStatus";
