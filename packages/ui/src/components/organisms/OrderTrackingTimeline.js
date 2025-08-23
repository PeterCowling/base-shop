import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { cn } from "../../utils/style";
/**
 * Vertical timeline showing progress of an order.
 * Steps usually come from carrier APIs (UPS, DHL, etc.) and may differ per
 * provider. Shops that disable tracking can omit this component entirely.
 */
export function OrderTrackingTimeline({ steps, shippingSteps = [], returnSteps = [], trackingEnabled = true, itemSpacing = "space-y-6", className, ...props }) {
    if (!trackingEnabled)
        return null;
    const merged = steps ?? [...shippingSteps, ...returnSteps];
    if (merged.length === 0)
        return null;
    return (_jsx("ol", { className: cn("relative border-l pl-4", itemSpacing, className), ...props, children: merged.map((step, idx) => (_jsxs("li", { className: "ml-6", children: [_jsx("span", { className: cn("absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border", step.complete
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"), children: step.complete && _jsx(CheckIcon, { className: "h-4 w-4" }) }), _jsx("p", { className: "font-medium", children: step.label }), step.date && (_jsx("time", { className: "block text-sm text-muted", children: step.date }))] }, idx))) }));
}
