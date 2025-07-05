import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/layout/Footer.tsx
import Link from "next/link";
import { memo } from "react";
import { cn } from "../../utils/cn";
const Footer = memo(function Footer({ height = "h-16", padding = "", }) {
    return (_jsxs("footer", { className: cn("flex items-center justify-center bg-gray-100 text-sm text-gray-500", height, padding), children: [" ", _jsxs("p", { className: "space-x-4", children: [_jsx(Link, { href: "/legal/privacy", className: "hover:underline", children: "Privacy" }), _jsx("span", { children: "\u00B7" }), _jsx(Link, { href: "/legal/terms", className: "hover:underline", children: "Terms" })] })] }));
});
export default Footer;
