"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { ProductQuickView } from "../overlays/ProductQuickView";
import { ProductCard } from "./ProductCard";
export function ProductGrid({ products, columns, minItems = 1, maxItems = 4, desktopItems, tabletItems, mobileItems, showImage = true, showPrice = true, ctaLabel = "Add to cart", onAddToCart, enableQuickView = false, className, ...props }) {
    const containerRef = React.useRef(null);
    const [cols, setCols] = React.useState(columns ?? desktopItems ?? minItems);
    const [quickViewProduct, setQuickViewProduct] = React.useState(null);
    React.useEffect(() => {
        if (columns || typeof ResizeObserver === "undefined" || !containerRef.current)
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
                setCols(chosen ?? minItems);
                return;
            }
            const ideal = Math.floor(width / ITEM_WIDTH) || 1;
            const clamped = Math.max(minItems, Math.min(maxItems, ideal));
            setCols(clamped);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [
        columns,
        minItems,
        maxItems,
        desktopItems,
        tabletItems,
        mobileItems,
    ]);
    const style = {
        gridTemplateColumns: `repeat(${columns ?? cols}, minmax(0, 1fr))`,
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { ref: containerRef, className: cn("grid gap-6", className), style: style, ...props, children: products.map((p) => (_jsxs("div", { className: "relative", children: [_jsx(ProductCard, { product: p, onAddToCart: onAddToCart, showImage: showImage, showPrice: showPrice, ctaLabel: ctaLabel }), enableQuickView && (_jsx(Button, { variant: "outline", className: "absolute right-2 top-2 h-8 px-2", "aria-label": `Quick view ${p.title}`, onClick: () => setQuickViewProduct(p), children: "Quick View" }))] }, p.id))) }), enableQuickView && quickViewProduct && (_jsx(ProductQuickView, { product: quickViewProduct, open: !!quickViewProduct, onOpenChange: (o) => !o && setQuickViewProduct(null), container: containerRef.current, onAddToCart: onAddToCart }))] }));
}
