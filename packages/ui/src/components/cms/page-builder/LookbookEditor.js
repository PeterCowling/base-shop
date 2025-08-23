import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Input } from "../../atoms/shadcn";
import ImagePicker from "./ImagePicker";
import { useArrayEditor } from "./useArrayEditor";
export default function LookbookEditor({ component, onChange }) {
    const handleInput = (field, value) => {
        onChange({ [field]: value });
    };
    const arrayEditor = useArrayEditor(onChange);
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Input, { value: component.src ?? "", onChange: (e) => handleInput("src", e.target.value), placeholder: "Image URL", className: "flex-1" }), _jsx(ImagePicker, { onSelect: (url) => handleInput("src", url), children: _jsx(Button, { type: "button", variant: "outline", children: "Pick" }) })] }), _jsx(Input, { value: component.alt ?? "", onChange: (e) => handleInput("alt", e.target.value), placeholder: "Alt text" }), arrayEditor("hotspots", component.hotspots, ["sku", "x", "y"], {
                minItems: component.minItems,
                maxItems: component.maxItems,
            })] }));
}
