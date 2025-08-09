import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, } from "./dialog";
const meta = {
    component: Dialog,
    args: {
        defaultOpen: true,
    },
    argTypes: {
        defaultOpen: { control: "boolean" },
    },
};
export default meta;
export const Default = {
    render: (args) => (_jsxs(Dialog, { ...args, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx("button", { children: "Open" }) }), _jsxs(DialogContent, { children: [_jsx(DialogTitle, { children: "Title" }), _jsx(DialogDescription, { children: "Description" })] })] })),
};
