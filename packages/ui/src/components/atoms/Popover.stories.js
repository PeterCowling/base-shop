import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
const meta = {
    title: "Atoms/Popover",
    component: Popover,
    parameters: { docs: { layout: "centered" } },
};
export default meta;
const DefaultRender = () => {
    const [open, setOpen] = useState(false);
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx("button", { className: "border px-2 py-1", children: "Toggle" }) }), _jsx(PopoverContent, { children: "Content" })] }));
};
export const Default = {
    render: () => _jsx(DefaultRender, {}),
};
