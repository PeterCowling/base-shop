"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { ProductQuickView } from "../overlays/ProductQuickView";
import { ProductCard } from "./ProductCard";
/**
 * Horizontally scrollable carousel for product cards.
 * The number of items per slide adapts to the component width
 * and stays within the provided `minItems`/`maxItems` range.
 */
export function ProductCarousel({ products, minItems = 1, maxItems = 5, desktopItems, tabletItems, mobileItems, gapClassName = "gap-4", getSlideWidth = (n) => `${100 / n}%`, className, enableQuickView = false, onAddToCart, ...props }) {
    const containerRef = React.useRef(null);
    const [itemsPerSlide, setItemsPerSlide] = React.useState(desktopItems ?? minItems);
    const [quickViewProduct, setQuickViewProduct] = React.useState(null);
    React.useEffect(() => {
        if (!containerRef.current || typeof ResizeObserver === "undefined")
            return;
        const el = containerRef.current;
        const ITEM_WIDTH = 250;
        const update = () => {
            const width = el.clientWidth;
            if (desktopItems || tabletItems || mobileItems) {
                const chosen = width >= 1024
                    ? desktopItems
                    : width >= 768
                        ? tabletItems
                        : mobileItems;
                setItemsPerSlide(chosen ?? minItems);
                return;
            }
            const ideal = Math.floor(width / ITEM_WIDTH) || 1;
            const clamped = Math.max(minItems, Math.min(maxItems, ideal));
            setItemsPerSlide(clamped);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [
        minItems,
        maxItems,
        desktopItems,
        tabletItems,
        mobileItems,
    ]);
    const width = getSlideWidth(itemsPerSlide);
    const slideStyle = { flex: `0 0 ${width}` };
    return (_jsxs(_Fragment, { children: [_jsx("div", { ref: containerRef, className: cn("overflow-hidden", className), ...props, children: _jsx("div", { className: cn("flex snap-x overflow-x-auto pb-4", gapClassName), children: products.map((p) => (_jsxs("div", { style: slideStyle, className: "relative snap-start", children: [_jsx(ProductCard, { product: p, className: "h-full" }), enableQuickView && (_jsx(Button, { variant: "outline", className: "absolute right-2 top-2 px-2 py-1 text-xs", "aria-label": `Quick view ${p.title}`, onClick: () => setQuickViewProduct(p), children: "Quick View" }))] }, p.id))) }) }), enableQuickView && quickViewProduct && (_jsx(ProductQuickView, { product: quickViewProduct, open: !!quickViewProduct, onOpenChange: (o) => !o && setQuickViewProduct(null), container: containerRef.current, onAddToCart: onAddToCart }))] }));
}
