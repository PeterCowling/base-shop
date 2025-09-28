"use client";

import * as React from "react";
import { cn } from "../../../utils/style";
import { Category, CategoryCard } from "../../organisms/CategoryCard";

export interface CollectionListProps extends React.HTMLAttributes<HTMLDivElement> {
  collections: Category[];
  /** Minimum number of tiles to show at once */
  minItems?: number;
  /** Maximum number of tiles to show at once */
  maxItems?: number;
  /** Tiles shown on desktop viewports */
  desktopItems?: number;
  /** Tiles shown on tablet viewports */
  tabletItems?: number;
  /** Tiles shown on mobile viewports */
  mobileItems?: number;
  /** Gap class applied to the grid */
  gapClassName?: string;
}

/**
 * Responsive grid of collection tiles. The number of columns adapts to the
 * component width and stays within the provided `minItems`/`maxItems` range.
 */
export default function CollectionList({
  collections,
  minItems = 1,
  maxItems = 4,
  desktopItems,
  tabletItems,
  mobileItems,
  gapClassName = "gap-4",
  className,
  ...props
}: CollectionListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cols, setCols] = React.useState(desktopItems ?? minItems);

  React.useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;
    const el = containerRef.current;
    const ITEM_WIDTH = 250;
    const update = () => {
      const width = el.clientWidth;
      if (desktopItems || tabletItems || mobileItems) {
        const chosen =
          width >= 1024
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

  const colsClass = React.useMemo(() => {
    // Map dynamic count to Tailwind grid-cols-* classes for a limited safe range
    const n = Math.max(1, Math.min(12, Number.isFinite(cols) ? cols : 1));
    return `grid-cols-${n}`;
  }, [cols]);

  return (
    <div ref={containerRef} className={cn("grid", colsClass, gapClassName, className)} {...props}>
      {collections.map((c) => (
        <CategoryCard key={c.id} category={c} className="h-full" />
      ))}
    </div>
  );
}
