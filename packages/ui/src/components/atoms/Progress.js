import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const Progress = React.forwardRef(({ value, label, className, ...props }, ref) => {
    return (_jsxs("div", { ref: ref, className: cn("space-y-1", className), ...props, children: [_jsx("div", { className: "bg-muted h-2 w-full overflow-hidden rounded", "data-token": "--color-muted", children: _jsx("div", { className: "bg-primary h-full transition-all", style: { width: `${value}%` }, "data-token": "--color-primary" }) }), label ? (_jsx("div", { className: "text-muted-foreground text-right text-sm", "data-token": "--color-muted-fg", children: label })) : null] }));
});
Progress.displayName = "Progress";
