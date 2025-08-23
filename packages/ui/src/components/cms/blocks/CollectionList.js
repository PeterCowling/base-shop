import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../../utils/style";
import { Category, CategoryCard } from "../../organisms/CategoryCard";
/**
 * Responsive grid of collection tiles. The number of columns adapts to the
 * component width and stays within the provided `minItems`/`maxItems` range.
 */
export default function CollectionList({ collections, minItems = 1, maxItems = 4, desktopItems, tabletItems, mobileItems, gapClassName = "gap-4", className, ...props }) {
    const containerRef = React.useRef(null);
    const [cols, setCols] = React.useState(desktopItems ?? minItems);
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
    }, [minItems, maxItems, desktopItems, tabletItems, mobileItems]);
    const style = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };
    return (_jsx("div", { ref: containerRef, className: cn("grid", gapClassName, className), style: style, ...props, children: collections.map((c) => (_jsx(CategoryCard, { category: c, className: "h-full" }, c.id))) }));
}
