"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LayoutProvider, ThemeProvider, useLayout } from "@platform-core";
import { cn } from "../../utils/cn";
function ShellLayout({ header, sideNav, footer, children, className, }) {
    const { isMobileNavOpen } = useLayout();
    return (_jsxs("div", { className: cn("flex min-h-screen flex-col", className), children: [header, _jsxs("div", { className: "flex flex-1", children: [isMobileNavOpen && sideNav, _jsx("main", { className: "flex-1", children: children })] }), footer] }));
}
export function AppShell(props) {
    return (_jsx(ThemeProvider, { children: _jsx(LayoutProvider, { children: _jsx(ShellLayout, { ...props }) }) }));
}
