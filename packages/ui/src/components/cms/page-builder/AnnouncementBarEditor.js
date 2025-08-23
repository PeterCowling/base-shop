import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
export default function AnnouncementBarEditor({ component, onChange }) {
    const handleInput = (field, value) => {
        onChange({ [field]: value });
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { value: component.text ?? "", onChange: (e) => handleInput("text", e.target.value), placeholder: "text" }), _jsx(Input, { value: component.link ?? "", onChange: (e) => handleInput("link", e.target.value), placeholder: "link" })] }));
}
