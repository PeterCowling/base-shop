import type { SKU } from "@acme/types";
export interface ProductQuickViewProps {
    /** Product to display */
    product: SKU;
    /** Controls modal visibility */
    open: boolean;
    /** Handler when open state changes */
    onOpenChange: (open: boolean) => void;
    /** Optional element whose dimensions should bound the overlay */
    container?: HTMLElement | null;
    /** Callback for adding item to cart */
    onAddToCart?: (product: SKU) => void;
}
/** Modal displaying a product with add-to-cart controls. */
export declare function ProductQuickView({ product, open, onOpenChange, container, onAddToCart, }: ProductQuickViewProps): import("react/jsx-runtime").JSX.Element;
export default ProductQuickView;
//# sourceMappingURL=ProductQuickView.d.ts.map