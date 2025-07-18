import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { boxProps } from "../../utils/boxProps";
import { cn } from "../../utils/cn";
export const FormField = React.forwardRef(({ label, htmlFor, error, required = false, width, height, padding, margin, className, children, ...props }, ref) => {
    const { classes, style } = boxProps({ width, height, padding, margin });
    return (_jsxs("div", { ref: ref, style: style, className: cn("flex flex-col gap-1", classes, className), ...props, children: [_jsxs("label", { htmlFor: htmlFor, className: "text-sm font-medium", children: [label, required && (_jsx("span", { "aria-hidden": "true", className: "text-red-600", children: "*" }))] }), children, error && _jsx("p", { className: "text-sm text-red-600", children: error })] }));
});
FormField.displayName = "FormField";
