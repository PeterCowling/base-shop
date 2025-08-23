import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../../atoms/shadcn";
import { cn } from "../../../utils/style/cn";
export default function PricingTable({ plans = [], minItems, maxItems, }) {
    const list = plans.slice(0, maxItems ?? plans.length);
    if (!list.length || list.length < (minItems ?? 0))
        return null;
    const colClass = {
        1: "md:grid-cols-1",
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-4",
    }[list.length] || "md:grid-cols-3";
    return (_jsx("section", { className: cn("grid grid-cols-1 gap-6", colClass), children: list.map((plan, i) => (_jsxs("div", { className: cn("flex flex-col rounded border p-6", plan.featured && "border-primary"), children: [_jsx("h3", { className: "text-xl font-semibold", children: plan.title }), _jsx("p", { className: "mt-2 text-2xl font-bold", children: plan.price }), _jsx("ul", { className: "mt-4 flex-1 space-y-2 text-sm", children: plan.features.map((f, idx) => (_jsx("li", { children: f }, idx))) }), _jsx(Button, { asChild: true, className: "mt-6 self-start", children: _jsx("a", { href: plan.ctaHref, children: plan.ctaLabel }) })] }, i))) }));
}
