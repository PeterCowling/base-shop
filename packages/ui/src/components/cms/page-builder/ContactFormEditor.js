import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
export default function ContactFormEditor({ component, onChange }) {
    const handleInput = (field, value) => {
        onChange({ [field]: value });
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { value: component.action ?? "", onChange: (e) => handleInput("action", e.target.value), placeholder: "action" }), _jsx(Input, { value: component.method ?? "", onChange: (e) => handleInput("method", e.target.value), placeholder: "method" })] }));
}
