// packages/ui/src/components/cms/style/Presets.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ReactElement } from "react";
import presetData from "./presets.json";
const presetList = presetData;
export default function Presets({ tokens, onChange, }) {
    const applyPreset = (id) => {
        const preset = presetList?.find((p) => p.id === id);
        if (preset) {
            onChange({ ...tokens, ...preset.tokens });
        }
    };
    const resetTokens = () => {
        // Revert to defaults by clearing overrides
        onChange({});
    };
    if (presetList.length === 0) {
        return (_jsx("p", { className: "text-sm text-muted", "data-testid": "presets-placeholder", children: "No presets available" }));
    }
    return (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("span", { children: "Preset" }), _jsxs("select", { "data-testid": "preset-select", className: "rounded border p-1", defaultValue: "", onChange: (e) => applyPreset(e.target.value), children: [_jsx("option", { value: "", disabled: true, children: "Choose\u2026" }), presetList.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id)))] })] }), _jsx("button", { type: "button", "data-testid": "preset-reset", className: "rounded border px-2 py-1", onClick: resetTokens, children: "Default" })] }));
}
