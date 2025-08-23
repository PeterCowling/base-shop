"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export default function Testimonials({ testimonials = [], minItems, maxItems, }) {
    const list = testimonials.slice(0, maxItems ?? testimonials.length);
    if (!list.length || list.length < (minItems ?? 0))
        return null;
    return (_jsx("section", { className: "space-y-4", children: list.map((t, i) => (_jsxs("blockquote", { className: "text-center", children: [_jsxs("p", { className: "mb-2 italic", children: ["\u201C", t.quote, "\u201D"] }), t.name && (_jsxs("footer", { className: "text-sm text-muted", children: ["\u2014 ", t.name] }))] }, i))) }));
}
