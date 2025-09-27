import * as React from "react";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";

export interface StockStatusProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  inStock: boolean;
  labelInStock?: string;
  labelOutOfStock?: string;
}

export const StockStatus = React.forwardRef<HTMLSpanElement, StockStatusProps>(
  (
    { inStock, labelInStock, labelOutOfStock, className, ...props },
    ref,
  ) => {
    const t = useTranslations();
    const color = inStock ? "text-success" : "text-danger";
    const token = inStock ? "--color-success" : "--color-danger";
    const inCopy = (labelInStock ?? (t("stock.inStock") as string));
    const outCopy = (labelOutOfStock ?? (t("stock.outOfStock") as string));
    const baseClass = "text-sm font-medium"; // i18n-exempt: CSS utility classes, not user copy
    return (
      <span
        ref={ref}
        className={cn(baseClass, color, className)}
        // i18n-exempt — design token attribute, not user copy
        data-token={token}
        {...props}
      >
        {inStock ? inCopy : outCopy}
      </span>
    );
  },
);
StockStatus.displayName = "StockStatus";
