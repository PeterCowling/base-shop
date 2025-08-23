"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { ProductCard } from "./ProductCard";
/**
 * Horizontally scrollable carousel that fetches product
 * recommendations from an API. The number of visible items
 * adapts to the current viewport width and is clamped between
 * the provided `minItems` and `maxItems` values.
 */
export function RecommendationCarousel({ endpoint, minItems = 1, maxItems = 4, desktopItems, tabletItems, mobileItems, gapClassName = "gap-4", getSlideWidth = (n) => `${100 / n}%`, className, ...props }) {
    const [products, setProducts] = React.useState([]);
    const [itemsPerSlide, setItemsPerSlide] = React.useState(desktopItems ?? minItems);
    React.useEffect(() => {
        const calculateItems = () => {
            const width = window.innerWidth;
            if (desktopItems || tabletItems || mobileItems) {
                const chosen = width >= 1024
                    ? desktopItems
                    : width >= 768
                        ? tabletItems
                        : mobileItems;
                setItemsPerSlide(chosen ?? minItems);
                return;
            }
            const approxItemWidth = 320;
            const count = Math.floor(width / approxItemWidth);
            setItemsPerSlide(Math.min(maxItems, Math.max(minItems, count || minItems)));
        };
        calculateItems();
        window.addEventListener("resize", calculateItems);
        return () => window.removeEventListener("resize", calculateItems);
    }, [
        minItems,
        maxItems,
        desktopItems,
        tabletItems,
        mobileItems,
    ]);
    React.useEffect(() => {
        const load = async () => {
            try {
                const url = new URL(endpoint, window.location.origin);
                url.searchParams.set("minItems", String(minItems));
                url.searchParams.set("maxItems", String(maxItems));
                const res = await fetch(url);
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
    }, [endpoint, minItems, maxItems]);
    const width = getSlideWidth(itemsPerSlide);
    const slideStyle = React.useMemo(() => ({ flex: `0 0 ${width}` }), [width]);
    if (!products.length)
        return null;
    return (_jsx("div", { className: cn("overflow-hidden", className), ...props, children: _jsx("div", { className: cn("flex snap-x overflow-x-auto pb-4", gapClassName), children: products.map((p) => (_jsx("div", { style: slideStyle, className: "snap-start", children: _jsx(ProductCard, { product: p, className: "h-full" }) }, p.id))) }) }));
}
