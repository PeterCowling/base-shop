import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const StockStatus = React.forwardRef(({ inStock, labelInStock = "In stock", labelOutOfStock = "Out of stock", className, ...props }, ref) => {
    const color = inStock ? "text-success" : "text-danger";
    const token = inStock ? "--color-success" : "--color-danger";
    return (_jsx("span", { ref: ref, className: cn("text-sm font-medium", color, className), "data-token": token, ...props, children: inStock ? labelInStock : labelOutOfStock }));
});
StockStatus.displayName = "StockStatus";
