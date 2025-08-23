import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
export default function TabsEditor({ component, onChange }) {
    const labels = component.labels ?? [];
    const active = component.active ?? 0;
    return (_jsxs(_Fragment, { children: [labels.map((label, i) => (_jsxs("div", { className: "flex items-end gap-2", children: [_jsx(Input, { label: `Tab ${i + 1} Label`, value: label, onChange: (e) => {
                            const copy = [...labels];
                            copy[i] = e.target.value;
                            onChange({ labels: copy });
                        } }), _jsx(Button, { type: "button", variant: "outline", onClick: () => {
                            const copy = labels.filter((_, idx) => idx !== i);
                            const patch = { labels: copy };
                            if (active >= copy.length)
                                patch.active = 0;
                            onChange(patch);
                        }, children: "Remove" })] }, i))), _jsx(Button, { type: "button", variant: "outline", onClick: () => onChange({ labels: [...labels, ""] }), children: "Add Tab" }), _jsxs(Select, { value: String(active), onValueChange: (v) => onChange({ active: v === undefined ? undefined : Number(v) }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Active Tab" }) }), _jsx(SelectContent, { children: labels.map((_, i) => (_jsx(SelectItem, { value: String(i), children: `Tab ${i + 1}` }, i))) })] })] }));
}
