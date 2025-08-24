"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from "react";
import { Button, Input } from "../../atoms/shadcn";
import ImagePicker from "./ImagePicker";
export function useArrayEditor(onChange) {
    return useCallback((prop, items, fields, limits) => {
        const list = (items ?? []);
        const min = limits?.minItems ?? 0;
        const max = limits?.maxItems ?? Infinity;
        return (_jsxs("div", { className: "space-y-2", children: [list.map((item, idx) => (_jsxs("div", { className: "space-y-1 rounded border p-2", children: [fields.map((f) => (_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Input, { value: item[f] ?? "", onChange: (e) => {
                                        const next = [...list];
                                        next[idx] = { ...next[idx], [f]: e.target.value };
                                        onChange({ [prop]: next });
                                    }, placeholder: f, className: "flex-1" }), f === "src" && (_jsx(ImagePicker, { onSelect: (url) => {
                                        const next = [...list];
                                        next[idx] = { ...next[idx], src: url };
                                        onChange({ [prop]: next });
                                    }, children: _jsx(Button, { type: "button", variant: "outline", children: "Pick" }) }))] }, f))), _jsx(Button, { variant: "destructive", onClick: () => {
                                const next = list.filter((_, i) => i !== idx);
                                onChange({ [prop]: next });
                            }, disabled: list.length <= min, children: "Remove" })] }, idx))), _jsx(Button, { onClick: () => {
                        const blank = Object.fromEntries(fields.map((f) => [f, ""]));
                        onChange({ [prop]: [...list, blank] });
                    }, disabled: list.length >= max, children: "Add" })] }));
    }, [onChange]);
}
