// packages/template-app/src/app/[lang]/product/[slug]/PdpClient.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ImageGallery from "@/components/pdp/ImageGallery";
import SizeSelector from "@/components/pdp/SizeSelector";
import AddToCartButton from "@/components/shop/AddToCartButton";
import { useState } from "react";
export default function PdpClient({ product }) {
    const [size, setSize] = useState(null);
    return (_jsxs("div", { className: "mx-auto max-w-6xl p-6 lg:grid lg:grid-cols-2 lg:gap-10", children: [_jsx(ImageGallery, { src: product.image, alt: product.title }), _jsxs("section", { className: "flex flex-col gap-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: product.title }), _jsx("p", { className: "text-gray-700", children: product.description }), _jsxs("div", { children: [_jsx("div", { className: "mb-2 font-medium", children: "Select size:" }), _jsx(SizeSelector, { sizes: product.sizes, onSelect: setSize })] }), _jsxs("div", { className: "text-2xl font-semibold", children: ["\u20AC", product.price] }), _jsx(AddToCartButton, { sku: product, size: size ?? undefined, disabled: !size })] })] }));
}
