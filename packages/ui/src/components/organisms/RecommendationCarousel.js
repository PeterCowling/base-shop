"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
import { ProductCard } from "./ProductCard";
/**
 * Horizontally scrollable carousel that fetches product
 * recommendations from an API.
 */
export function RecommendationCarousel({ endpoint, itemsPerSlide = 3, gapClassName = "gap-4", getSlideWidth = (n) => `${100 / n}%`, className, ...props }) {
    const [products, setProducts] = React.useState([]);
    React.useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(endpoint);
                if (!res.ok)
                    return;
                const data = (await res.json());
                setProducts(data);
            }
            catch (err) {
                console.error("Failed loading recommendations", err);
            }
        };
        void load();
    }, [endpoint]);
    const width = getSlideWidth(itemsPerSlide);
    const slideStyle = React.useMemo(() => ({ flex: `0 0 ${width}` }), [width]);
    if (!products.length)
        return null;
    return (_jsx("div", { className: cn("overflow-hidden", className), ...props, children: _jsx("div", { className: cn("flex snap-x overflow-x-auto pb-4", gapClassName), children: products.map((p) => (_jsx("div", { style: slideStyle, className: "snap-start", children: _jsx(ProductCard, { product: p, className: "h-full" }) }, p.id))) }) }));
}
