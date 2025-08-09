import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "./Select";
const meta = {
    title: "Atoms/Shadcn/Select",
    component: Select,
    tags: ["autodocs"],
    args: {},
};
export default meta;
export const Default = {
    render: (args) => (_jsxs(Select, { ...args, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select option" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "one", children: "One" }), _jsx(SelectItem, { value: "two", children: "Two" })] })] })),
};
