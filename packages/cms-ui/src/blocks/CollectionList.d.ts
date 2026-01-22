import * as React from "react";
import { Category } from "@acme/ui/components/organisms/CategoryCard";
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
export default function CollectionList({ collections, minItems, maxItems, desktopItems, tabletItems, mobileItems, gapClassName, className, ...props }: CollectionListProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CollectionList.d.ts.map