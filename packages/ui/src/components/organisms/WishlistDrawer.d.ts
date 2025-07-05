import * as React from "react";
import { Product } from "./ProductCard";
export interface WishlistDrawerProps {
    /** Button or element that toggles the drawer */
    trigger: React.ReactNode;
    /** Products marked as favourites */
    items: Product[];
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
