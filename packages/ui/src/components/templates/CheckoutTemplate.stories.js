import { jsx as _jsx } from "react/jsx-runtime";
import { CheckoutTemplate } from "./CheckoutTemplate";
const steps = [
    { label: "Shipping", content: _jsx("div", { children: "Shipping info" }) },
    { label: "Payment", content: _jsx("div", { children: "Payment details" }) },
    { label: "Review", content: _jsx("div", { children: "Review order" }) },
];
const meta = {
    component: CheckoutTemplate,
    args: { steps },
};
export default meta;
export const Default = {};
