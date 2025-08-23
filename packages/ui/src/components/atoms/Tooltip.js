import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const Tooltip = ({ text, children, className }) => (_jsxs("span", { className: cn("group relative inline-block", className), children: [children, _jsx("span", { className: "bg-fg text-bg absolute top-full left-1/2 z-10 mt-2 hidden -translate-x-1/2 rounded px-2 py-1 text-xs whitespace-nowrap group-hover:block", children: text })] }));
