import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
export const ProductBadge = React.forwardRef(({ label, variant = "default", className, ...props }, ref) => {
    const variants = {
        default: "bg-gray-200 text-gray-800",
        sale: "bg-red-500 text-white",
        new: "bg-green-500 text-white",
    };
    return (_jsx("span", { ref: ref, className: cn("rounded px-2 py-1 text-xs font-semibold", variants[variant], className), ...props, children: label }));
});
ProductBadge.displayName = "ProductBadge";
