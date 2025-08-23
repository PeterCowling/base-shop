import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import * as React from "react";
import { cn } from "../../utils/style";
export function Breadcrumbs({ items, className, ...props }) {
    return (_jsx("nav", { className: cn("flex flex-wrap items-center gap-1 text-xs sm:text-sm", className), ...props, children: items.map((item, idx) => {
            const last = idx === items.length - 1;
            return (_jsxs("span", { className: "flex items-center gap-1", children: [idx > 0 && _jsx("span", { children: "/" }), item.href && !last ? (_jsx(Link, { href: item.href, className: cn("capitalize hover:underline", "text-muted-foreground"), children: item.label })) : (_jsx("span", { className: "capitalize", children: item.label }))] }, idx));
        }) }));
}
Breadcrumbs.displayName = "Breadcrumbs";
export default Breadcrumbs;
