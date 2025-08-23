import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
export default function RecommendationCarouselEditor({ component, onChange }) {
    const handleNum = (field, value) => {
        const num = value ? Number(value) : undefined;
        onChange({ [field]: isNaN(num) ? undefined : num });
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { label: "Endpoint", value: component.endpoint ?? "", onChange: (e) => onChange({ endpoint: e.target.value }) }), _jsx(Input, { label: "Desktop Items", type: "number", value: component.desktopItems ?? "", onChange: (e) => handleNum("desktopItems", e.target.value) }), _jsx(Input, { label: "Tablet Items", type: "number", value: component.tabletItems ?? "", onChange: (e) => handleNum("tabletItems", e.target.value) }), _jsx(Input, { label: "Mobile Items", type: "number", value: component.mobileItems ?? "", onChange: (e) => handleNum("mobileItems", e.target.value) })] }));
}
