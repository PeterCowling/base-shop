// packages/ui/src/components/cms/page-builder/panels/InteractionsPanel.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../../../atoms/shadcn";
export default function InteractionsPanel({ component, handleInput, }) {
    const clickAction = component.clickAction ?? "none";
    const animation = component.animation ?? "none";
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs(Select, { value: clickAction, onValueChange: (v) => {
                    handleInput("clickAction", (v === "none" ? undefined : v));
                    if (v !== "navigate")
                        handleInput("href", undefined);
                }, children: [_jsx(SelectTrigger, { "aria-label": "Click Action", children: _jsx(SelectValue, { placeholder: "Click Action" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "None" }), _jsx(SelectItem, { value: "navigate", children: "Navigate" })] })] }), clickAction === "navigate" && (_jsx(Input, { label: "Target", placeholder: "https://example.com", value: component.href ?? "", onChange: (e) => handleInput("href", e.target.value) })), _jsxs(Select, { value: animation, onValueChange: (v) => handleInput("animation", (v === "none" ? undefined : v)), children: [_jsx(SelectTrigger, { "aria-label": "Animation", children: _jsx(SelectValue, { placeholder: "Animation" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "None" }), _jsx(SelectItem, { value: "fade", children: "Fade" }), _jsx(SelectItem, { value: "slide", children: "Slide" })] })] })] }));
}
