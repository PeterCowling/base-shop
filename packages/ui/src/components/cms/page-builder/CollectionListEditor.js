import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";
export default function CollectionListEditor({ component, onChange }) {
    const arrayEditor = useArrayEditor(onChange);
    const handleNum = (field, value) => {
        const num = value ? Number(value) : undefined;
        onChange({ [field]: isNaN(num) ? undefined : num });
    };
    return (_jsxs("div", { className: "space-y-2", children: [arrayEditor("collections", component.collections, ["id", "title", "image"], {
                minItems: component.minItems,
                maxItems: component.maxItems,
            }), _jsx(Input, { label: "Desktop Items", type: "number", value: component.desktopItems ?? "", onChange: (e) => handleNum("desktopItems", e.target.value) }), _jsx(Input, { label: "Tablet Items", type: "number", value: component.tabletItems ?? "", onChange: (e) => handleNum("tabletItems", e.target.value) }), _jsx(Input, { label: "Mobile Items", type: "number", value: component.mobileItems ?? "", onChange: (e) => handleNum("mobileItems", e.target.value) })] }));
}
