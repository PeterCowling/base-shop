import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";
export default function ButtonEditor({ component, onChange }) {
    const { handleInput } = useComponentInputs(onChange);
    return (_jsxs(_Fragment, { children: [_jsx(Input, { label: "Label", value: component.label ?? "", onChange: (e) => handleInput("label", e.target.value) }), _jsx(Input, { label: "URL", value: component.href ?? "", onChange: (e) => handleInput("href", e.target.value) }), _jsxs(Select, { value: component.variant ?? "", onValueChange: (v) => handleInput("variant", (v || undefined)), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Variant" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "default", children: "default" }), _jsx(SelectItem, { value: "outline", children: "outline" }), _jsx(SelectItem, { value: "ghost", children: "ghost" }), _jsx(SelectItem, { value: "destructive", children: "destructive" })] })] })] }));
}
