import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
import { ProductCard } from "./ProductCard";
export function ProductGrid({ products, columns = 3, showImage = true, showPrice = true, ctaLabel = "Add to cart", onAddToCart, className, ...props }) {
    const style = {
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    };
    return (_jsx("div", { className: cn("grid gap-6", className), style: style, ...props, children: products.map((p) => (_jsx(ProductCard, { product: p, onAddToCart: onAddToCart, showImage: showImage, showPrice: showPrice, ctaLabel: ctaLabel }, p.id))) }));
}
