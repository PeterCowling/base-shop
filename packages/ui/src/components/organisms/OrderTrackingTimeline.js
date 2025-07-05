import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "../../utils/cn";
/**
 * Vertical timeline showing progress of an order.
 */
export function OrderTrackingTimeline({ steps, itemSpacing = "space-y-6", className, ...props }) {
    return (_jsxs("ol", { className: cn("relative border-l pl-4", itemSpacing, className), ...props, children: [" ", steps.map((step, idx) => (_jsxs("li", { className: "ml-6", children: [_jsx("span", { className: cn("absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border", step.complete
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"), children: step.complete && _jsx(CheckIcon, { className: "h-4 w-4" }) }), _jsx("p", { className: "font-medium", children: step.label }), step.date && (_jsx("time", { className: "block text-sm text-gray-500", children: step.date }))] }, idx)))] }));
}
