import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
export default function SearchBarEditor({ component, onChange }) {
    const handleInput = (field, value) => {
        onChange({ [field]: value });
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { value: component.placeholder ?? "", onChange: (e) => handleInput("placeholder", e.target.value), placeholder: "placeholder" }), _jsx(Input, { type: "number", value: component.limit ?? "", onChange: (e) => handleInput("limit", e.target.value ? Number(e.target.value) : undefined), placeholder: "limit" })] }));
}
