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
    const n = Number(cols);
    if (!Number.isFinite(n) || n < 1) return "grid-cols-1";

    const rounded = Math.max(1, Math.min(12, Math.floor(n)));

    switch (rounded) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      case 5:
        return "grid-cols-5";
      case 6:
        return "grid-cols-6";
      case 7:
        return "grid-cols-7";
      case 8:
        return "grid-cols-8";
      case 9:
        return "grid-cols-9";
      case 10:
        return "grid-cols-10";
      case 11:
        return "grid-cols-11";
      default:
        return "grid-cols-12";
    }
  }, [cols]);

  const { style: _style, ...restProps } = props;

  return (
    <div
      ref={containerRef}
      className={cn("grid", colsClass, gapClassName, className)}
      {...restProps}
    >
      {collections.map((c) => (
        <CategoryCard key={c.id} category={c} className="h-full" />
      ))}
    </div>
  );
}
