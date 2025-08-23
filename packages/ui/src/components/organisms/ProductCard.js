import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from "next/image";
import * as React from "react";
import { boxProps } from "../../utils/style";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
export const ProductCard = React.forwardRef(({ product, onAddToCart, showImage = true, showPrice = true, ctaLabel = "Add to cart", padding = "p-4", width, height, margin, className, ...props }, ref) => {
    const { classes, style } = boxProps({ width, height, padding, margin });
    const media = product.media?.[0];
    return (_jsxs("div", { ref: ref, style: style, className: cn("flex flex-col gap-3 rounded-lg border", classes, className), ...props, children: [showImage && media && (_jsx("div", { className: "relative aspect-square", children: media.type === "image" ? (_jsx(Image, { src: media.url ?? "", alt: media.altText ?? product.title ?? "", fill: true, sizes: "(min-width: 640px) 25vw, 50vw", className: "rounded-md object-cover" })) : (_jsx("video", { src: media.url ?? "", className: "h-full w-full rounded-md object-cover", muted: true, playsInline: true })) })), _jsx("h3", { className: "font-medium", children: product.title ?? "" }), showPrice && product.price != null && (_jsx(Price, { amount: product.price, className: "font-semibold" })), onAddToCart && (_jsx(Button, { onClick: () => onAddToCart(product), children: ctaLabel }))] }));
});
ProductCard.displayName = "ProductCard";
