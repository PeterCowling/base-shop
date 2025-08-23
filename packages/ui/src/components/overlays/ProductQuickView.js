import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { Dialog, DialogContent } from "../atoms/shadcn";
import { ProductCard } from "../organisms/ProductCard";
/** Modal displaying a product with add-to-cart controls. */
export function ProductQuickView({ product, open, onOpenChange, container, onAddToCart, }) {
    const [dims, setDims] = React.useState({
        width: 0,
        height: 0,
    });
    React.useEffect(() => {
        if (open && container) {
            const rect = container.getBoundingClientRect();
            setDims({ width: rect.width, height: rect.height });
        }
    }, [open, container]);
    const style = React.useMemo(() => {
        return {
            width: dims.width || undefined,
            height: dims.height || undefined,
            maxWidth: "90vw",
            maxHeight: "90vh",
        };
    }, [dims]);
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsx(DialogContent, { className: "p-0", style: style, children: _jsx(ProductCard, { product: product, onAddToCart: onAddToCart, className: "h-full w-full overflow-auto" }) }) }));
}
export default ProductQuickView;
