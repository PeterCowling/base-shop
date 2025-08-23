import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input, Textarea } from "../../atoms/shadcn";
export default function ProductBundleEditor({ component, onChange }) {
    const handleSkus = (value) => {
        const items = value
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        onChange({ skus: items });
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Textarea, { label: "SKUs", placeholder: "skus", value: (component.skus ?? []).join(","), onChange: (e) => handleSkus(e.target.value) }), _jsx(Input, { label: "Discount (%)", placeholder: "discount", type: "number", value: component.discount ?? "", onChange: (e) => onChange({ discount: Number(e.target.value) }) }), _jsx(Input, { label: "Quantity", placeholder: "quantity", type: "number", value: component.quantity ?? "", onChange: (e) => onChange({ quantity: Number(e.target.value) }) })] }));
}
