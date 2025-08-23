import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";
export default function HeaderEditor({ component, onChange }) {
    const arrayEditor = useArrayEditor(onChange);
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { value: component.logo ?? "", onChange: (e) => onChange({ logo: e.target.value }), placeholder: "logo" }), arrayEditor("nav", component.nav, ["label", "url"])] }));
}
