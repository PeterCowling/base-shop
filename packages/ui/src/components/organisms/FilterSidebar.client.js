"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/primitives/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../atoms/primitives/select";
export function FilterSidebar({ onChange, width = "w-64", }) {
    const [open, setOpen] = React.useState(false);
    const [size, setSize] = React.useState("");
    const deferredSize = React.useDeferredValue(size);
    React.useEffect(() => {
        onChange({ size: deferredSize || undefined });
    }, [deferredSize, onChange]);
    const widthClass = typeof width === "number" ? `w-[${width}px]` : width;
    return (_jsxs(DialogPrimitive.Root, { open: open, onOpenChange: setOpen, children: [_jsx(DialogPrimitive.Trigger, { asChild: true, children: _jsx(Button, { variant: "outline", children: "Filters" }) }), _jsxs(DialogPrimitive.Portal, { children: [_jsx(DialogPrimitive.Overlay, { className: "fixed inset-0 z-40 bg-fg/50" }), _jsxs(DialogPrimitive.Content, { className: cn(widthClass, "bg-background fixed inset-y-0 left-0 z-50 border-r p-4 shadow-lg focus:outline-none"), children: [_jsx(DialogPrimitive.Title, { className: "mb-4 text-lg font-semibold", children: "Filters" }), _jsx("form", { "aria-label": "Filters", className: "space-y-4", onSubmit: (e) => e.preventDefault(), children: _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", htmlFor: "size-select", children: "Size" }), _jsxs(Select, { value: size, onValueChange: (v) => setSize(v === "all" ? "" : v), children: [" ", _jsx(SelectTrigger, { id: "size-select", className: "w-full", children: _jsx(SelectValue, { placeholder: "All" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All" }), ["36", "37", "38", "39", "40", "41", "42", "43", "44"].map((s) => (_jsx(SelectItem, { value: s, children: s }, s)))] })] })] }) })] })] })] }));
}
