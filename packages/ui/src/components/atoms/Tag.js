import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const Tag = React.forwardRef(({ className, variant = "default", children, ...props }, ref) => {
    const bgClasses = {
        default: "bg-muted",
        success: "bg-success",
        warning: "bg-warning",
        destructive: "bg-danger",
    };
    const textClasses = {
        default: "text-fg",
        success: "text-success-fg",
        warning: "text-warning-fg",
        destructive: "text-danger-foreground",
    };
    const bgTokens = {
        default: "--color-muted",
        success: "--color-success",
        warning: "--color-warning",
        destructive: "--color-danger",
    };
    const textTokens = {
        default: "--color-fg",
        success: "--color-success-fg",
        warning: "--color-warning-fg",
        destructive: "--color-danger-fg",
    };
    return (_jsx("span", { ref: ref, "data-token": bgTokens[variant], className: cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", bgClasses[variant], className), ...props, children: _jsx("span", { className: textClasses[variant], "data-token": textTokens[variant], children: children }) }));
});
Tag.displayName = "Tag";
