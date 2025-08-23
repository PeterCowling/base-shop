import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../../atoms/shadcn";
export default function FormBuilderEditor({ component, onChange }) {
    const fields = component.fields ?? [];
    const updateField = (idx, key, value) => {
        const next = [...fields];
        next[idx] = { ...next[idx], [key]: value };
        onChange({ fields: next });
    };
    const addField = () => {
        onChange({
            fields: [...fields, { type: "text", name: "", label: "" }],
        });
    };
    const removeField = (idx) => {
        const next = fields.filter((_, i) => i !== idx);
        onChange({ fields: next });
    };
    return (_jsxs("div", { className: "space-y-2", children: [fields.map((field, idx) => (_jsxs("div", { className: "space-y-1 rounded border p-2", children: [_jsxs(Select, { value: field.type, onValueChange: (v) => updateField(idx, "type", v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "text", children: "text" }), _jsx(SelectItem, { value: "email", children: "email" }), _jsx(SelectItem, { value: "select", children: "select" })] })] }), _jsx(Input, { value: field.name ?? "", onChange: (e) => updateField(idx, "name", e.target.value), placeholder: "name" }), _jsx(Input, { value: field.label ?? "", onChange: (e) => updateField(idx, "label", e.target.value), placeholder: "label" }), field.type === "select" && (_jsx(Input, { value: (field.options ?? [])
                            .map((o) => o.label)
                            .join(","), onChange: (e) => updateField(idx, "options", e.target.value
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean)
                            .map((v) => ({ label: v, value: v }))), placeholder: "options (comma separated)" })), _jsx(Button, { variant: "destructive", onClick: () => removeField(idx), children: "Remove" })] }, idx))), _jsx(Button, { onClick: addField, children: "Add field" })] }));
}
