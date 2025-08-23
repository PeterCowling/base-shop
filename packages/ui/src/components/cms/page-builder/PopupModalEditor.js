import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../../atoms/shadcn";
export default function PopupModalEditor({ component, onChange }) {
    const handleInput = (field, value) => {
        onChange({ [field]: value });
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { value: component.width ?? "", onChange: (e) => handleInput("width", e.target.value), placeholder: "width" }), _jsx(Input, { value: component.height ?? "", onChange: (e) => handleInput("height", e.target.value), placeholder: "height" }), _jsxs(Select, { value: component.trigger ?? "", onValueChange: (v) => handleInput("trigger", v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "trigger" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "load", children: "load" }), _jsx(SelectItem, { value: "delay", children: "delay" }), _jsx(SelectItem, { value: "exit", children: "exit intent" })] })] }), _jsx(Input, { type: "number", value: component.delay ?? "", onChange: (e) => handleInput("delay", e.target.value ? Number(e.target.value) : undefined), placeholder: "delay (ms)" }), _jsx(Textarea, { value: component.content ?? "", onChange: (e) => handleInput("content", e.target.value), placeholder: "content" })] }));
}
