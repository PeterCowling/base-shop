// packages/ui/components/cms/StyleEditor.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Presets from "./style/Presets";
import Tokens from "./style/Tokens";
export default function StyleEditor(props) {
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Presets, { ...props }), _jsx(Tokens, { ...props })] }));
}
