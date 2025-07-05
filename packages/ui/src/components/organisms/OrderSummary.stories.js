import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import OrderSummary from "./OrderSummary";
/* ------------------------------------------------------------------ *
 *  Storybook meta
 * ------------------------------------------------------------------ */
const meta = {
    title: "Organisms/Order Summary",
    component: OrderSummary,
};
export default meta;
/* ------------------------------------------------------------------ *
 *  Stories
 * ------------------------------------------------------------------ */
export const Default = {
    render: () => (_jsxs("div", { className: "space-y-2", children: [_jsx(OrderSummary, {}), _jsx("table", { className: "w-full text-sm", children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2", children: "Shipping" }), _jsx("td", { className: "text-right", children: "\u20AC5" })] }), _jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2", children: "Tax" }), _jsx("td", { className: "text-right", children: "\u20AC3" })] }), _jsxs("tr", { children: [_jsx("td", {}), _jsx("td", { className: "py-2", children: "Discount" }), _jsx("td", { className: "text-right", children: "-\u20AC2" })] })] }) })] })),
};
