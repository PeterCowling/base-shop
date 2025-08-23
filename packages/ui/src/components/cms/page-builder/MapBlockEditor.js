import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
export default function MapBlockEditor({ component, onChange }) {
    const handleNumber = (field, value) => {
        const num = value === "" ? undefined : Number(value);
        onChange({ [field]: num });
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { label: "Latitude", type: "number", value: component.lat ?? "", onChange: (e) => handleNumber("lat", e.target.value) }), _jsx(Input, { label: "Longitude", type: "number", value: component.lng ?? "", onChange: (e) => handleNumber("lng", e.target.value) }), _jsx(Input, { label: "Zoom", type: "number", value: component.zoom ?? "", onChange: (e) => handleNumber("zoom", e.target.value) })] }));
}
