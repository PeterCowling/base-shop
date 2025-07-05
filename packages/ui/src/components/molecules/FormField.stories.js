import { jsx as _jsx } from "react/jsx-runtime";
import { FormField } from "./FormField";
const meta = {
    component: FormField,
    args: {
        label: "Name",
        htmlFor: "name",
        required: false,
        error: "",
    },
};
export default meta;
export const Default = {
    render: (args) => (_jsx(FormField, { ...args, children: _jsx("input", { id: args.htmlFor }) })),
};
