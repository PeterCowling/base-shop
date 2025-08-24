"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function Accordion({ items }) {
    const [open, setOpen] = useState([]);
    const toggle = (idx) => {
        setOpen((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);
    };
    return (_jsx("div", { className: "space-y-2", children: items.map((item, idx) => {
            const isOpen = open.includes(idx);
            return (_jsxs("div", { className: "rounded border", children: [_jsxs("button", { type: "button", "aria-expanded": isOpen, onClick: () => toggle(idx), className: "flex w-full items-center justify-between p-2 text-left", children: [_jsx("span", { children: item.title }), _jsx("span", { children: isOpen ? "-" : "+" })] }), isOpen && _jsx("div", { className: "border-t p-2", children: item.content })] }, idx));
        }) }));
}
export default Accordion;
