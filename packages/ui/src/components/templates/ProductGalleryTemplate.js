import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
import { ProductCard } from "../organisms/ProductCard";
import { ProductCarousel } from "../organisms/ProductCarousel";
/**
 * Display a list of products in a grid or carousel layout.
 */
export function ProductGalleryTemplate({ products, useCarousel = false, itemsPerSlide, className, ...props }) {
    if (useCarousel) {
        return (_jsx(ProductCarousel, { products: products, itemsPerSlide: itemsPerSlide, className: className, ...props }));
    }
    return (_jsx("div", { className: cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className), ...props, children: products.map((p) => (_jsx(ProductCard, { product: p }, p.id))) }));
}
