import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
export const Progress = React.forwardRef(({ step, total = 4, className, ...props }, ref) => {
    const percent = ((step + 1) / total) * 100;
    return (_jsxs("div", { ref: ref, className: cn("space-y-1", className), ...props, children: [_jsx("div", { className: "bg-muted h-2 w-full overflow-hidden rounded", children: _jsx("div", { className: "bg-primary h-full transition-all", style: { width: `${percent}%` } }) }), _jsxs("div", { className: "text-muted-foreground text-right text-sm", children: ["Step ", step + 1, " of ", total] })] }));
});
Progress.displayName = "Progress";
