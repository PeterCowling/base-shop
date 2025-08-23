import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { RatingStars } from "../atoms/RatingStars";
import { ProductFeatures } from "../organisms/ProductFeatures";
export function FeaturedProductTemplate({ product, onAddToCart, ctaLabel = "Add to cart", className, ...props }) {
    const firstMedia = product.media?.[0];
    return (_jsxs("div", { className: cn("grid gap-6 md:grid-cols-2", className), ...props, children: [firstMedia?.url && (_jsx("div", { className: "relative aspect-square w-full", children: firstMedia.type === "image" ? (_jsx(Image, { src: firstMedia.url, alt: product.title ?? "", fill: true, sizes: "(min-width: 768px) 50vw, 100vw", className: "rounded-md object-cover" })) : (_jsx("video", { src: firstMedia.url, className: "h-full w-full rounded-md object-cover", muted: true, playsInline: true })) })), _jsxs("div", { className: "flex flex-col gap-4", children: [_jsx("h2", { className: "text-2xl font-semibold", children: product.title }), product.rating !== undefined && (_jsx(RatingStars, { rating: product.rating, className: "self-start" })), typeof product.price === "number" && (_jsx(Price, { amount: product.price, className: "text-xl font-bold" })), product.features && _jsx(ProductFeatures, { features: product.features }), onAddToCart && (_jsx(Button, { onClick: () => onAddToCart(product), children: ctaLabel }))] })] }));
}
