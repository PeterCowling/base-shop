import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
/**
 * Basic homepage layout with slots for a hero area and a
 * recommendations section.
 */
export function HomepageTemplate({ hero, recommendations, children, className, ...props }) {
    return (_jsxs("div", { className: cn("space-y-12", className), ...props, children: [hero && _jsx("section", { children: hero }), children, recommendations && _jsx("section", { children: recommendations })] }));
}
