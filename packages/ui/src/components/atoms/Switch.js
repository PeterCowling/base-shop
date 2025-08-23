import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const Switch = React.forwardRef(({ className, ...props }, ref) => (_jsxs("label", { className: cn("relative inline-flex cursor-pointer items-center", className), children: [_jsx("input", { ref: ref, type: "checkbox", className: "peer sr-only", ...props }), _jsx("span", { className: "bg-input peer-checked:bg-primary peer-focus:ring-ring peer-focus:ring-offset-background relative h-5 w-9 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-offset-2", "data-token": "--color-primary", children: _jsx("span", { className: "bg-background absolute top-0.5 left-0.5 h-4 w-4 rounded-full shadow transition-transform peer-checked:translate-x-4", "data-token": "--color-bg" }) })] })));
Switch.displayName = "Switch";
