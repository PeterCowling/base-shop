// src/molecules/index.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { CategoryCollectionTemplate } from "../../templates/CategoryCollectionTemplate";
const defaultPreview = "/window.svg";
export const NewsletterForm = memo(function NewsletterForm({ action = "#", method = "post", placeholder = "", submitLabel = "", locale = "en", }) {
    const ph = typeof placeholder === "string" ? placeholder : (placeholder[locale] ?? "");
    const label = typeof submitLabel === "string" ? submitLabel : (submitLabel[locale] ?? "");
    return (_jsxs("form", { action: action, method: method, className: "flex gap-2", children: [_jsx("input", { type: "email", name: "email", placeholder: ph, className: "flex-1 rounded border p-2", "data-token": "--color-bg" }), _jsx("button", { type: "submit", className: "rounded bg-primary px-4 py-2 text-primary-fg", "data-token": "--color-primary", children: _jsx("span", { "data-token": "--color-primary-fg", children: label }) })] }));
});
export const PromoBanner = memo(function PromoBanner({ text = "", href, buttonLabel = "", locale = "en", }) {
    const txt = typeof text === "string" ? text : (text[locale] ?? "");
    const label = typeof buttonLabel === "string" ? buttonLabel : (buttonLabel[locale] ?? "");
    return (_jsxs("div", { className: "flex items-center justify-between bg-fg p-4 text-bg", children: [_jsx("span", { children: txt }), href && (_jsx("a", { href: href, className: "rounded bg-bg px-3 py-1 text-fg", children: label }))] }));
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
const moleculeEntries = {
    NewsletterForm: { component: NewsletterForm },
    PromoBanner: { component: PromoBanner },
    CategoryList: { component: CategoryList },
};
export const moleculeRegistry = Object.fromEntries(Object.entries(moleculeEntries).map(([k, v]) => [
    k,
    { previewImage: defaultPreview, ...v },
]));
