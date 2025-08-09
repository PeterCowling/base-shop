import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "./select";
const meta = {
    component: Select,
    args: {
        defaultValue: "apple",
    },
    argTypes: {
        defaultValue: { control: "select", options: ["apple", "banana", "orange"] },
    },
};
export default meta;
export const Default = {
    render: (args) => (_jsxs(Select, { ...args, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "apple", children: "Apple" }), _jsx(SelectItem, { value: "banana", children: "Banana" }), _jsx(SelectItem, { value: "orange", children: "Orange" })] })] })),
};
