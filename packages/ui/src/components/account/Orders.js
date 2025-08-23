import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// packages/ui/src/components/account/Orders.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getOrdersForCustomer } from "@acme/platform-core/orders";
import { getTrackingStatus as getShippingTrackingStatus } from "@acme/platform-core/shipping";
import { getTrackingStatus as getReturnTrackingStatus } from "@acme/platform-core/returnAuthorization";
import { redirect } from "next/navigation";
import StartReturnButton from "./StartReturnButton";
import { OrderTrackingTimeline } from "../organisms/OrderTrackingTimeline";
export const metadata = { title: "Orders" };
export default async function OrdersPage({ shopId, title = "Orders", callbackUrl = "/account/orders", returnsEnabled = false, returnPolicyUrl, trackingEnabled = true, trackingProviders = [], }) {
    const session = await getCustomerSession();
    if (!session) {
        redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return null;
    }
    if (!hasPermission(session.role, "view_orders")) {
        return _jsx("p", { className: "p-6", children: "Not authorized." });
    }
    const orders = await getOrdersForCustomer(shopId, session.customerId);
    if (!orders.length)
        return _jsx("p", { className: "p-6", children: "No orders yet." });
    const items = await Promise.all(orders.map(async (o) => {
        let shippingSteps = [];
        let returnSteps = [];
        let status = null;
        const returnStatus = o.returnStatus ?? null;
        if (trackingEnabled && trackingProviders.length > 0 && o.trackingNumber) {
            const provider = trackingProviders[0];
            const ship = await getShippingTrackingStatus({
                provider,
                trackingNumber: o.trackingNumber,
            });
            shippingSteps = ship.steps;
            status = ship.status;
            const ret = await getReturnTrackingStatus({
                provider,
                trackingNumber: o.trackingNumber,
            });
            returnSteps = ret.steps;
        }
        return (_jsxs("li", { className: "rounded border p-4", children: [_jsxs("div", { children: ["Order: ", o.id] }), o.expectedReturnDate && _jsxs("div", { children: ["Return: ", o.expectedReturnDate] }), _jsx(OrderTrackingTimeline, { shippingSteps: shippingSteps, returnSteps: returnSteps, trackingEnabled: trackingEnabled, className: "mt-2" }), status && _jsxs("p", { className: "mt-2 text-sm", children: ["Status: ", status] }), returnStatus && (_jsxs("p", { className: "mt-2 text-sm", children: ["Return: ", returnStatus] })), returnsEnabled && !o.returnedAt && (_jsx(StartReturnButton, { sessionId: o.sessionId }))] }, o.id));
    }));
    return (_jsxs(_Fragment, { children: [_jsx("h1", { className: "p-6 text-xl", children: title }), returnsEnabled && returnPolicyUrl && (_jsx("p", { className: "p-6 pt-0", children: _jsx("a", { href: returnPolicyUrl, target: "_blank", rel: "noopener noreferrer", className: "underline", children: "Return policy" }) })), _jsx("ul", { className: "space-y-2 p-6", children: items })] }));
}
