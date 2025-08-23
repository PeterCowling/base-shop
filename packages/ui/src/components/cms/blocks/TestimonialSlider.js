"use client";
import { jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export default function TestimonialSlider({ testimonials = [], minItems, maxItems, }) {
    const list = testimonials.slice(0, maxItems ?? testimonials.length);
    const [i, setI] = useState(0);
    useEffect(() => {
        if (!list.length)
            return;
        const id = setInterval(() => setI((n) => (n + 1) % list.length), 5000);
        return () => clearInterval(id);
    }, [list.length]);
    if (!list.length || list.length < (minItems ?? 0))
        return null;
    const t = list[i % list.length];
    return (_jsxs("section", { className: "space-y-2 text-center", children: [_jsxs("blockquote", { className: "italic", children: ["\u201C", t.quote, "\u201D"] }), t.name && _jsxs("footer", { className: "text-sm text-muted", children: ["\u2014 ", t.name] })] }));
}
