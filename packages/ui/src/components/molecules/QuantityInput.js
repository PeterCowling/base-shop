import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
/**
 * Numeric input with increment/decrement buttons.
 */
export const QuantityInput = React.forwardRef(({ value, min = 1, max = Infinity, onChange, className, ...props }, ref) => {
    const handleDec = () => {
        if (value > min && onChange)
            onChange(value - 1);
    };
    const handleInc = () => {
        if (value < max && onChange)
            onChange(value + 1);
    };
    return (_jsxs("div", { ref: ref, className: cn("flex items-center gap-2", className), ...props, children: [_jsx("button", { type: "button", onClick: handleDec, disabled: value <= min, className: "rounded border px-2 disabled:opacity-50", children: "-" }), _jsx("span", { className: "min-w-[2ch] text-center", children: value }), _jsx("button", { type: "button", onClick: handleInc, disabled: value >= max, className: "rounded border px-2 disabled:opacity-50", children: "+" })] }));
});
QuantityInput.displayName = "QuantityInput";
