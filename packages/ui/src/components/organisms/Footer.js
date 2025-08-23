import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const Footer = React.forwardRef(({ className, links = [], logo, ...props }, ref) => (_jsxs("footer", { ref: ref, "data-token": "--color-bg", className: cn("flex h-14 items-center justify-between border-t px-4", className), ...props, children: [logo && (_jsx("span", { className: "font-bold", "data-token": "--color-fg", children: logo })), _jsx("nav", { className: "ml-auto flex gap-4 text-sm", children: links.map((l) => (_jsx("a", { href: l.href, className: "hover:underline", "data-token": "--color-fg", children: l.label }, l.href))) })] })));
Footer.displayName = "Footer";
