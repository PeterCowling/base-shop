// src/components/home/ReviewsCarousel.tsx
"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useTranslations } from "@/i18n/Translations";
import { useCallback, useEffect, useState } from "react";
const DEFAULT_REVIEWS = [
    { nameKey: "review.anna.name", quoteKey: "review.anna.quote" },
    { nameKey: "review.luca.name", quoteKey: "review.luca.quote" },
    { nameKey: "review.emma.name", quoteKey: "review.emma.quote" },
];
export default function ReviewsCarousel({ reviews = DEFAULT_REVIEWS, }) {
    const t = useTranslations();
    const [i, setI] = useState(0);
    const list = reviews.length ? reviews : DEFAULT_REVIEWS;
    const next = useCallback(() => setI((n) => (n + 1) % list.length), [list.length]);
    useEffect(() => {
        const id = setInterval(next, 8000);
        return () => clearInterval(id);
    }, [next]);
    const { nameKey, quoteKey } = list[i];
    return (_jsx("section", { className: "bg-gray-50 py-16", children: _jsxs("div", { className: "mx-auto max-w-2xl px-4 text-center", children: [_jsxs("blockquote", { className: "mb-6 text-2xl font-medium text-gray-800 italic", children: ["\u201C", t(quoteKey), "\u201D"] }), _jsxs("div", { className: "font-semibold text-gray-600", children: ["\u2014 ", t(nameKey)] })] }) }));
}
