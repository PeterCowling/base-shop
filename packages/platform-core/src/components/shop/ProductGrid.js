"use strict";
// src/components/shop/ProductGrid.tsx
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductGrid = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ProductCard_1 = require("./ProductCard");
function ProductGridInner({ skus, columns, minItems = 1, maxItems = 3, desktopItems, tabletItems, mobileItems, className, ...rest }) {
    // simple alphabetic sort for deterministic order (SSR/CSR match)
    const sorted = (0, react_1.useMemo)(() => [...skus].sort((a, b) => a.title.localeCompare(b.title)), [skus]);
    const containerRef = (0, react_1.useRef)(null);
    const [cols, setCols] = (0, react_1.useState)(columns ?? desktopItems ?? minItems);
    (0, react_1.useEffect)(() => {
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
    return ((0, jsx_runtime_1.jsx)("section", { ref: containerRef, ...rest, className: `grid gap-6 ${className ?? ""}`, style: { gridTemplateColumns: `repeat(${columns ?? cols}, minmax(0, 1fr))` }, children: sorted.length
            ? sorted.map((sku) => (0, jsx_runtime_1.jsx)(ProductCard_1.ProductCard, { sku: sku }, sku.id))
            : Array.from({ length: columns ?? cols }).map((_, i) => ((0, jsx_runtime_1.jsx)("div", { "data-cy": "placeholder", className: "h-64 rounded-lg bg-gray-200 animate-pulse" }, i))) }));
}
exports.ProductGrid = (0, react_1.memo)(ProductGridInner);
