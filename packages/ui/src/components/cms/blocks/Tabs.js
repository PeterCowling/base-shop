"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { cn } from "../../../utils/style";
export default function TabsBlock({ labels = [], active = 0, children, className, }) {
    const [current, setCurrent] = useState(active);
    const contents = Array.isArray(children) ? children : [children];
    const safeIndex = Math.min(current, Math.max(contents.length - 1, 0));
    return (_jsxs("div", { className: className, children: [_jsx("div", { className: "flex gap-2 border-b pb-2", children: labels.map((label, i) => (_jsx("button", { type: "button", onClick: () => setCurrent(i), className: cn("border-b-2 px-3 py-1 text-sm", i === safeIndex
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"), children: label }, i))) }), _jsx("div", { className: "pt-4", children: contents[safeIndex] })] }));
}
