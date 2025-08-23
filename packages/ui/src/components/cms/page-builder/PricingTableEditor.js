import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Input, Textarea } from "../../atoms/shadcn";
export default function PricingTableEditor({ component, onChange }) {
    const plans = component.plans ?? [];
    const min = component.minItems ?? 0;
    const max = component.maxItems ?? Infinity;
    const update = (idx, field, value) => {
        const next = [...plans];
        next[idx] = { ...next[idx], [field]: value };
        onChange({ plans: next });
    };
    const removePlan = (idx) => {
        onChange({
            plans: plans.filter((_plan, i) => i !== idx),
        });
    };
    const addPlan = () => {
        onChange({
            plans: [
                ...plans,
                { title: "", price: "", features: [], ctaLabel: "", ctaHref: "" },
            ],
        });
    };
    return (_jsxs("div", { className: "space-y-2", children: [plans.map((plan, i) => (_jsxs("div", { className: "space-y-1 rounded border p-2", children: [_jsx(Input, { value: plan.title ?? "", onChange: (e) => update(i, "title", e.target.value), placeholder: "title", className: "w-full" }), _jsx(Input, { value: plan.price ?? "", onChange: (e) => update(i, "price", e.target.value), placeholder: "price", className: "w-full" }), _jsx(Textarea, { value: (plan.features ?? []).join("\n"), onChange: (e) => update(i, "features", e.target.value
                            .split(/\n+/)
                            .map((f) => f.trim())
                            .filter(Boolean)), placeholder: "one feature per line", className: "w-full" }), _jsx(Input, { value: plan.ctaLabel ?? "", onChange: (e) => update(i, "ctaLabel", e.target.value), placeholder: "CTA label", className: "w-full" }), _jsx(Input, { value: plan.ctaHref ?? "", onChange: (e) => update(i, "ctaHref", e.target.value), placeholder: "CTA href", className: "w-full" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm", children: "Featured" }), _jsx("input", { type: "checkbox", checked: plan.featured ?? false, onChange: (e) => update(i, "featured", e.target.checked) })] }), _jsx(Button, { variant: "destructive", onClick: () => removePlan(i), disabled: plans.length <= min, children: "Remove Plan" })] }, i))), _jsx(Button, { onClick: addPlan, disabled: plans.length >= max, children: "Add Plan" })] }));
}
