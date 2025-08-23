import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const Toast = React.forwardRef(({ open, onClose, message, className, ...props }, ref) => {
    if (!open)
        return null;
    return (_jsxs("div", { ref: ref, className: cn("bg-fg text-bg fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md px-4 py-2 shadow-lg", className), "data-token": "--color-fg", ...props, children: [_jsx("span", { "data-token": "--color-bg", children: message }), onClose && (_jsx("button", { type: "button", onClick: onClose, className: "ml-2 font-bold", "data-token": "--color-bg", children: "\u00D7" }))] }));
});
Toast.displayName = "Toast";
