"use client";
import { jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export default function TestimonialSlider({ testimonials = [], }) {
    const [i, setI] = useState(0);
    useEffect(() => {
        if (!testimonials.length)
            return;
        const id = setInterval(() => setI((n) => (n + 1) % testimonials.length), 5000);
        return () => clearInterval(id);
    }, [testimonials.length]);
    if (!testimonials.length)
        return null;
    const t = testimonials[i];
    return (_jsxs("section", { className: "space-y-2 text-center", children: [_jsxs("blockquote", { className: "italic", children: ["\u201C", t.quote, "\u201D"] }), t.name && _jsxs("footer", { className: "text-sm text-gray-600", children: ["\u2014 ", t.name] })] }));
}
