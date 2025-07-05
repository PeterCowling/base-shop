import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
import { OrderTrackingTimeline } from "../organisms/OrderTrackingTimeline";
export function OrderTrackingTemplate({ orderId, steps, address, className, ...props }) {
    return (_jsxs("div", { className: cn("space-y-6", className), ...props, children: [_jsx("h2", { className: "text-xl font-semibold", children: "Order Tracking" }), _jsxs("p", { children: ["Reference", _jsxs("span", { className: "font-mono", children: [" ", orderId] })] }), address && (_jsxs("p", { className: "text-muted-foreground text-sm", children: ["Shipping to ", address] })), _jsx(OrderTrackingTimeline, { steps: steps })] }));
}
