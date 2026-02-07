import * as React from "react";

import { useTranslations } from "@acme/i18n";

import { cn } from "../../utils/style";

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
    const baseClass = "text-sm font-medium"; // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility classes, not user copy
    return (
      <span
        ref={ref}
        className={cn(baseClass, color, className)}
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — design token attribute, not user copy
        data-token={token}
        {...props}
      >
        {inStock ? inCopy : outCopy}
      </span>
    );
  },
);
StockStatus.displayName = "StockStatus";
