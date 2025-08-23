import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";
export default function StoreLocatorBlockEditor({ component, onChange }) {
    const arrayEditor = useArrayEditor(onChange);
    const handleNumber = (field, value) => {
        const num = value === "" ? undefined : Number(value);
        onChange({ [field]: isNaN(num) ? undefined : num });
    };
    return (_jsxs("div", { className: "space-y-2", children: [arrayEditor("locations", component.locations, ["lat", "lng", "label"]), _jsx(Input, { label: "Zoom", type: "number", value: component.zoom ?? "", onChange: (e) => handleNumber("zoom", e.target.value) })] }));
}
