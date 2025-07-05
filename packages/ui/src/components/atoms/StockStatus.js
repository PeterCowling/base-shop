import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
export const StockStatus = React.forwardRef(({ inStock, labelInStock = "In stock", labelOutOfStock = "Out of stock", className, ...props }, ref) => {
    const color = inStock ? "text-green-600" : "text-red-600";
    return (_jsx("span", { ref: ref, className: cn("text-sm font-medium", color, className), ...props, children: inStock ? labelInStock : labelOutOfStock }));
});
StockStatus.displayName = "StockStatus";
