"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function FontSelect({ value, options, onChange, onUpload, }) {
    return (_jsxs("span", { className: "flex flex-col gap-1", children: [_jsx("select", { className: "flex-1 rounded border p-1", value: value, onChange: (e) => onChange(e.target.value), children: options.map((o) => (_jsx("option", { value: o, style: { fontFamily: o }, children: o }, o))) }), _jsx("input", { type: "file", accept: ".woff,.woff2,.ttf,.otf", onChange: onUpload })] }));
}
