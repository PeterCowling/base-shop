import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";
export default function ProductGridEditor({ component, onChange }) {
    const { handleInput } = useComponentInputs(onChange);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Checkbox, { id: "quickView", checked: component.quickView ?? false, onCheckedChange: (v) => handleInput("quickView", v ? true : undefined) }), _jsx("label", { htmlFor: "quickView", className: "text-sm", children: "Enable Quick View" })] }), _jsxs(Select, { value: component.mode ?? "collection", onValueChange: (v) => handleInput("mode", v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Source" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "collection", children: "Collection" }), _jsx(SelectItem, { value: "manual", children: "Manual SKUs" })] })] }), component.mode === "collection" ? (_jsx(Input, { label: "Collection ID", value: component.collectionId ?? "", onChange: (e) => handleInput("collectionId", e.target.value) })) : (_jsx(Textarea, { label: "SKUs (comma separated)", value: (component.skus ?? []).join(","), onChange: (e) => handleInput("skus", e.target.value
                    .split(/[\s,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean)) }))] }));
}
