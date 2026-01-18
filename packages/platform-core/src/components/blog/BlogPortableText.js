"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPortableText = BlogPortableText;
const jsx_runtime_1 = require("react/jsx-runtime");
// src/components/blog/BlogPortableText.tsx
const react_1 = require("@portabletext/react");
const link_1 = __importDefault(require("next/link"));
const products_1 = require("../../products");
const ProductCard_1 = require("../shop/ProductCard");
const components = {
    types: {
        productReference: ({ value, }) => {
            const ids = Array.isArray(value?.ids)
                ? value.ids
                : Array.isArray(value?.slugs)
                    ? value.slugs
                    : typeof value?.id === "string"
                        ? [value.id]
                        : typeof value?.slug === "string"
                            ? [value.slug]
                            : [];
            const products = ids
                .map((id) => (0, products_1.getProductById)(id) ?? (0, products_1.getProductBySlug)(id))
                .filter((p) => Boolean(p));
            if (products.length === 0)
                return null;
            if (products.length === 1) {
                const p = products[0];
                return ((0, jsx_runtime_1.jsx)(link_1.default, { href: `../product/${p.slug}`, className: "underline", children: p.title }));
            }
            return (
            // eslint-disable-next-line ds/enforce-layout-primitives -- ABC-123 horizontal scroller with mapped items
            (0, jsx_runtime_1.jsx)("div", { className: "inline-flex gap-4 overflow-x-auto py-4", children: products.map((p) => ((0, jsx_runtime_1.jsx)(ProductCard_1.ProductCard, { sku: p }, p.id))) }));
        },
        embed: ({ value }) => ((0, jsx_runtime_1.jsx)("div", { className: "aspect-video", children: (0, jsx_runtime_1.jsx)("iframe", { src: value.url, className: "h-full w-full" }) })),
    },
    marks: {
        link: ({ children, value }) => {
            const href = value?.href ?? "";
            return ((0, jsx_runtime_1.jsx)("a", { href: href, className: "text-blue-600 underline inline-block min-h-11 min-w-11", target: "_blank", rel: "noopener noreferrer", children: children }));
        },
        em: ({ children }) => (0, jsx_runtime_1.jsx)("em", { children: children }),
    },
    block: {
        h1: ({ children }) => (0, jsx_runtime_1.jsx)("h1", { children: children }),
        h2: ({ children }) => (0, jsx_runtime_1.jsx)("h2", { children: children }),
        h3: ({ children }) => (0, jsx_runtime_1.jsx)("h3", { children: children }),
    },
};
function BlogPortableText({ value }) {
    return (0, jsx_runtime_1.jsx)(react_1.PortableText, { value: value, components: components });
}
