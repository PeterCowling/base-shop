import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input, Textarea } from "../../atoms/shadcn";
export default function GiftCardEditor({ component, onChange }) {
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { value: component.denominations?.join(",") ?? "", onChange: (e) => onChange({
                    denominations: e.target.value
                        .split(/[\s,]+/)
                        .map((s) => parseInt(s.trim(), 10))
                        .filter((n) => !isNaN(n)),
                }), placeholder: "Amounts (comma separated)" }), _jsx(Textarea, { value: component.description ?? "", onChange: (e) => onChange({ description: e.target.value }), placeholder: "Description" })] }));
}
