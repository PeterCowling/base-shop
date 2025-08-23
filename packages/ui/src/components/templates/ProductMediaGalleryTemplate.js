import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { ProductBadge } from "../atoms/ProductBadge";
import { ProductGallery } from "../organisms/ProductGallery";
export function ProductMediaGalleryTemplate({ product, onAddToCart, ctaLabel = "Add to cart", className, ...props }) {
    const galleryMedia = (product.media ?? [])
        .filter((m) => !!m?.url)
        .map((m) => ({
        type: m.type,
        src: m.url,
        alt: m.altText,
    }));
    return (_jsxs("div", { className: cn("grid gap-6 md:grid-cols-2", className), ...props, children: [_jsx(ProductGallery, { media: galleryMedia }), _jsxs("div", { className: "flex flex-col gap-4", children: [_jsx("h2", { className: "text-2xl font-semibold", children: product.title }), product.badges && (_jsx("div", { className: "flex gap-2", children: product.badges.map((b, idx) => (_jsx(ProductBadge, { label: b.label, variant: b.variant }, idx))) })), typeof product.price === "number" && (_jsx(Price, { amount: product.price, className: "text-xl font-bold" })), product.description && _jsx("p", { children: product.description }), onAddToCart && (_jsx(Button, { onClick: () => onAddToCart(product), children: ctaLabel }))] })] }));
}
