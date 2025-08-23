import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const Radio = React.forwardRef(({ className, label, children, ...props }, ref) => (_jsxs("label", { className: cn("inline-flex items-center gap-2", className), children: [" ", _jsx("input", { ref: ref, type: "radio", className: "accent-primary", ...props }), label ?? children] })));
Radio.displayName = "Radio";
