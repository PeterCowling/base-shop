"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export default function BlogListing({ posts = [] }) {
    if (!posts.length)
        return null;
    return (_jsx("section", { className: "space-y-4", children: posts.map((p) => (_jsxs("article", { className: "space-y-1", children: [p.url ? (_jsx("h3", { className: "text-lg font-semibold", children: _jsx(Link, { href: p.url, children: p.title }) })) : (_jsx("h3", { className: "text-lg font-semibold", children: p.title })), p.excerpt && _jsx("p", { className: "text-gray-600", children: p.excerpt })] }, p.title))) }));
}
