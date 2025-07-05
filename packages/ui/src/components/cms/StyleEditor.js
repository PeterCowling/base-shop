// packages/ui/components/cms/StyleEditor.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@/components/atoms-shadcn";
import { useTokenEditor } from "@ui/hooks/useTokenEditor";
import { ColorInput, FontSelect, RangeInput } from "./index";
export default function StyleEditor({ tokens, onChange }) {
    const { colors, fonts, others, sansFonts, monoFonts, googleFonts, newFont, setNewFont, setToken, handleUpload, addCustomFont, setGoogleFont, } = useTokenEditor(tokens, onChange);
    const renderInput = (k, v) => {
        if (k.startsWith("--color")) {
            return (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "w-40 flex-shrink-0", children: k }), _jsx(ColorInput, { value: v, onChange: (val) => setToken(k, val) })] }, k));
        }
        if (k.startsWith("--font")) {
            const options = k.includes("mono") ? monoFonts : sansFonts;
            const type = k.includes("mono") ? "mono" : "sans";
            return (_jsx("label", { className: "flex flex-col gap-1 text-sm", children: _jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-40 flex-shrink-0", children: k }), _jsx(FontSelect, { value: v, options: options, onChange: (val) => setToken(k, val), onUpload: (e) => handleUpload(type, e) }), _jsxs("select", { className: "rounded border p-1", onChange: (e) => {
                                if (e.target.value) {
                                    setGoogleFont(type, e.target.value);
                                    e.target.value = "";
                                }
                            }, children: [_jsx("option", { value: "", children: "Google Fonts" }), googleFonts.map((f) => (_jsx("option", { value: f, style: { fontFamily: f }, children: f }, f)))] })] }) }, k));
        }
        if (/px$/.test(v)) {
            return (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "w-40 flex-shrink-0", children: k }), _jsx(RangeInput, { value: v, onChange: (val) => setToken(k, val) })] }, k));
        }
        return (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "w-40 flex-shrink-0", children: k }), _jsx(Input, { value: v, onChange: (e) => setToken(k, e.target.value) })] }, k));
    };
    return (_jsxs("div", { className: "max-h-64 space-y-4 overflow-y-auto rounded border p-2", children: [colors.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "font-medium", children: "Colors" }), colors.map(([k, v]) => renderInput(k, v))] })), fonts.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "font-medium", children: "Fonts" }), fonts.map(([k, v]) => renderInput(k, v)), _jsxs("div", { className: "flex items-center gap-2 pt-2", children: [_jsx(Input, { placeholder: "Add font stack", value: newFont, onChange: (e) => setNewFont(e.target.value) }), _jsx("button", { type: "button", className: "rounded border px-2 py-1", onClick: addCustomFont, children: "Add" })] })] })), others.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "font-medium", children: "Others" }), others.map(([k, v]) => renderInput(k, v))] }))] }));
}
