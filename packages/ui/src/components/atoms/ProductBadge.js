import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const ProductBadge = React.forwardRef(({ label, variant = "default", className, ...props }, ref) => {
    const bgClasses = {
        default: "bg-muted",
        sale: "bg-danger",
        new: "bg-success",
    };
    const textClasses = {
        default: "text-fg",
        sale: "text-danger-foreground",
        new: "text-success-fg",
    };
    const bgTokens = {
        default: "--color-muted",
        sale: "--color-danger",
        new: "--color-success",
    };
    const textTokens = {
        default: "--color-fg",
        sale: "--color-danger-fg",
        new: "--color-success-fg",
    };
    return (_jsx("span", { ref: ref, "data-token": bgTokens[variant], className: cn("rounded px-2 py-1 text-xs font-semibold", bgClasses[variant], className), ...props, children: _jsx("span", { className: textClasses[variant], "data-token": textTokens[variant], children: label }) }));
});
ProductBadge.displayName = "ProductBadge";
