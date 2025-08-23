import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Textarea } from "../../atoms/shadcn";
export default function ProductComparisonEditor({ component, onChange }) {
    const handleList = (field, value) => {
        const items = value
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        onChange({ [field]: items });
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Textarea, { label: "SKUs (comma or newline separated)", value: (component.skus ?? []).join(","), onChange: (e) => handleList("skus", e.target.value) }), _jsx(Textarea, { label: "Attributes (comma separated)", value: (component.attributes ?? []).join(","), onChange: (e) => handleList("attributes", e.target.value) })] }));
}
