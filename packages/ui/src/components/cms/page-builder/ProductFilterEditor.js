import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import useComponentInputs from "./useComponentInputs";
export default function ProductFilterEditor({ component, onChange }) {
    const { handleInput } = useComponentInputs(onChange);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm", children: "Show size" }), _jsx("input", { type: "checkbox", checked: component.showSize ?? true, onChange: (e) => handleInput("showSize", e.target.checked) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm", children: "Show color" }), _jsx("input", { type: "checkbox", checked: component.showColor ?? true, onChange: (e) => handleInput("showColor", e.target.checked) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-sm", children: "Show price" }), _jsx("input", { type: "checkbox", checked: component.showPrice ?? true, onChange: (e) => handleInput("showPrice", e.target.checked) })] })] }));
}
