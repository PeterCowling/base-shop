import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "./Dialog";
const meta = {
    title: "Atoms-shadcn/Dialog",
    component: Dialog,
    tags: ["autodocs"],
    argTypes: { open: { control: "boolean" } },
    args: { open: true },
};
export default meta;
export const Default = {
    render: (args) => (_jsxs(Dialog, { ...args, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx("button", { children: "Open" }) }), _jsx(DialogContent, { children: _jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Title" }), _jsx(DialogDescription, { children: "Description" })] }) })] })),
};
