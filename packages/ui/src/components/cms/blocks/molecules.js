// src/molecules/index.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { CategoryCollectionTemplate } from "../../templates/CategoryCollectionTemplate";
export const NewsletterForm = memo(function NewsletterForm({ action = "#", method = "post", placeholder = "", submitLabel = "", locale = "en", }) {
    const ph = typeof placeholder === "string" ? placeholder : (placeholder[locale] ?? "");
    const label = typeof submitLabel === "string" ? submitLabel : (submitLabel[locale] ?? "");
    return (_jsxs("form", { action: action, method: method, className: "flex gap-2", children: [_jsx("input", { type: "email", name: "email", placeholder: ph, className: "flex-1 rounded border p-2" }), _jsx("button", { type: "submit", className: "rounded bg-blue-600 px-4 py-2 text-white", children: label })] }));
});
export const PromoBanner = memo(function PromoBanner({ text = "", href, buttonLabel = "", locale = "en", }) {
    const txt = typeof text === "string" ? text : (text[locale] ?? "");
    const label = typeof buttonLabel === "string" ? buttonLabel : (buttonLabel[locale] ?? "");
    return (_jsxs("div", { className: "flex items-center justify-between bg-gray-900 p-4 text-white", children: [_jsx("span", { children: txt }), href && (_jsx("a", { href: href, className: "rounded bg-white px-3 py-1 text-gray-900", children: label }))] }));
});
/* ──────────────────────────────────────────────────────────────────────────
 * CategoryList
 * --------------------------------------------------------------------------*/
export const CategoryList = memo(function CategoryList({ categories = [], columns = 3, }) {
    if (!categories.length)
        return null;
    return (_jsx(CategoryCollectionTemplate, { categories: categories, columns: columns }));
});
/* ──────────────────────────────────────────────────────────────────────────
 * Molecule registry
 * --------------------------------------------------------------------------*/
export const moleculeRegistry = {
    NewsletterForm,
    PromoBanner,
    CategoryList,
};
