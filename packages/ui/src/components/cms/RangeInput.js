"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export function RangeInput({ value, onChange, min = 0, max = 64, }) {
    const num = parseInt(value, 10);
    return (_jsxs(_Fragment, { children: [_jsx("input", { type: "range", min: min, max: max, value: num, onChange: (e) => onChange(`${e.target.value}px`) }), _jsxs("span", { className: "w-10 text-right", children: [num, "px"] })] }));
}
