import * as React from "react";
import type { SKU } from "@acme/types";
export interface WishlistDrawerProps {
    /** Button or element that toggles the drawer */
    trigger: React.ReactNode;
    /** Products marked as favourites */
    items: SKU[];
    /**
     * Optional width for the drawer.
     * Can be a Tailwind width class or numeric pixel value.
     */
    width?: string | number;
}
/**
 * Slide-over panel listing products added to the user's wishlist.
 * Accepts an external trigger element to open the drawer.
 */
export declare function WishlistDrawer({ trigger, items, width, }: WishlistDrawerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=WishlistDrawer.d.ts.map