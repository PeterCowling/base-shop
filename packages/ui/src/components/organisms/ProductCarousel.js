import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
import { ProductCard } from "./ProductCard";
/**
 * Horizontally scrollable carousel for product cards.
 * Items per slide can be controlled via the `itemsPerSlide` prop.
 */
export function ProductCarousel({ products, itemsPerSlide = 3, gapClassName = "gap-4", getSlideWidth = (n) => `${100 / n}%`, className, ...props }) {
    const width = getSlideWidth(itemsPerSlide);
    const slideStyle = { flex: `0 0 ${width}` };
    return (_jsx("div", { className: cn("overflow-hidden", className), ...props, children: _jsx("div", { className: cn("flex snap-x overflow-x-auto pb-4", gapClassName), children: products.map((p) => (_jsx("div", { style: slideStyle, className: "snap-start", children: _jsx(ProductCard, { product: p, className: "h-full" }) }, p.id))) }) }));
}
