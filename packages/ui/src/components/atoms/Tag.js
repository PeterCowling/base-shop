import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
export const Tag = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
    const variants = {
        default: "bg-muted text-fg",
        success: "bg-green-500 text-white",
        warning: "bg-yellow-500 text-white",
        destructive: "bg-red-500 text-white",
    };
    return (_jsx("span", { ref: ref, className: cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", variants[variant], className), ...props }));
});
Tag.displayName = "Tag";
