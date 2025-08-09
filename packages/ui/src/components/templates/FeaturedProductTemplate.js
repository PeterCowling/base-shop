import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from "next/image";
import { cn } from "../../utils/cn";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { RatingStars } from "../atoms/RatingStars";
import { ProductFeatures } from "../organisms/ProductFeatures";
export function FeaturedProductTemplate({ product, onAddToCart, ctaLabel = "Add to cart", className, ...props }) {
    return (_jsxs("div", { className: cn("grid gap-6 md:grid-cols-2", className), ...props, children: [_jsx("div", { className: "relative aspect-square w-full", children: _jsx(Image, { src: product.image, alt: product.title, fill: true, sizes: "(min-width: 768px) 50vw, 100vw", className: "rounded-md object-cover" }) }), _jsxs("div", { className: "flex flex-col gap-4", children: [_jsx("h2", { className: "text-2xl font-semibold", children: product.title }), product.rating !== undefined && (_jsx(RatingStars, { rating: product.rating, className: "self-start" })), _jsx(Price, { amount: product.price, className: "text-xl font-bold" }), product.features && _jsx(ProductFeatures, { features: product.features }), onAddToCart && (_jsx(Button, { onClick: () => onAddToCart(product), children: ctaLabel }))] })] }));
}
