"use client";

import * as React from "react";
import { cn } from "../../../utils/style";
import { Category, CategoryCard } from "../../organisms/CategoryCard";

export interface CollectionListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "style"> {
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

  const gridTemplateColumns = React.useMemo(() => {
    const numericCols = Number(cols);
    if (!Number.isFinite(numericCols) || numericCols <= 0) {
      return `repeat(${Math.max(1, minItems)}, minmax(0, 1fr))`;
    }

    const columnCount = Math.max(1, Math.floor(numericCols));
    return `repeat(${columnCount}, minmax(0, 1fr))`;
  }, [cols, minItems]);

  return (
    <div
      ref={containerRef}
      className={cn("grid", gapClassName, className)}
      // eslint-disable-next-line react/forbid-dom-props -- DS-12345 dynamic grid templates require inline styles for correct sizing
      style={{ gridTemplateColumns }}
      {...props}
    >
      {collections.map((c) => (
        <CategoryCard key={c.id} category={c} className="h-full" />
      ))}
    </div>
  );
}
