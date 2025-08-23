import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
export default function SocialProofEditor({ component, onChange }) {
    const handleInput = (field, value) => {
        onChange({ [field]: value });
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { value: component.source ?? "", onChange: (e) => handleInput("source", e.target.value), placeholder: "data source URL" }), _jsx(Input, { type: "number", value: component.frequency ?? "", onChange: (e) => handleInput("frequency", e.target.value === "" ? undefined : Number(e.target.value)), placeholder: "frequency (ms)" })] }));
}
