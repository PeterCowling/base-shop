"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export default function Testimonials({ testimonials = [], }) {
    if (!testimonials.length)
        return null;
    return (_jsx("section", { className: "space-y-4", children: testimonials.map((t, i) => (_jsxs("blockquote", { className: "text-center", children: [_jsxs("p", { className: "mb-2 italic", children: ["\u201C", t.quote, "\u201D"] }), t.name && (_jsxs("footer", { className: "text-sm text-gray-600", children: ["\u2014 ", t.name] }))] }, i))) }));
}
