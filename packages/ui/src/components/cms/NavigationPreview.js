import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
export default function NavigationPreview({ items, style }) {
    return (_jsx("nav", { style: style, className: "bg-background text-foreground p-4 rounded border", "data-token": "--color-bg", children: _jsx("ul", { className: "flex gap-4", children: items.map((item) => (_jsx(NavItemView, { item: item }, item.id))) }) }));
}
function NavItemView({ item }) {
    return (_jsxs("li", { className: "relative group", children: [_jsx("a", { href: item.url || "#", className: "font-medium", "data-token": "--color-fg", children: item.label || "Item" }), item.children && item.children.length > 0 && (_jsx("ul", { className: "absolute left-0 top-full hidden min-w-[8rem] flex-col rounded-md border bg-background p-2 shadow-md group-hover:flex", "data-token": "--color-bg", children: item.children.map((child) => (_jsx("li", { children: _jsx("a", { href: child.url || "#", className: "block px-2 py-1 hover:underline", "data-token": "--color-fg", children: child.label || "Item" }) }, child.id))) }))] }));
}
