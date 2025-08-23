import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
/**
 * Radio-group style selector for choosing a payment method.
 */
export function PaymentMethodSelector({ methods, value, onChange, className, ...props }) {
    const group = React.useId();
    return (_jsx("div", { className: cn("flex flex-col gap-2", className), ...props, children: methods.map((m) => (_jsxs("label", { className: "flex cursor-pointer items-center gap-2", children: [_jsx("input", { type: "radio", name: group, value: m.value, checked: value === m.value, onChange: () => onChange?.(m.value), className: "accent-primary size-4" }), m.icon && _jsx("span", { className: "size-6", children: m.icon }), _jsx("span", { children: m.label })] }, m.value))) }));
}
PaymentMethodSelector.displayName = "PaymentMethodSelector";
