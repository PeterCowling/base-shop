"use client";
import * as React from "react";
import { Dialog, DialogContent, Button } from "../atoms/shadcn";
import type { SKU } from "@acme/types";
import { ProductCard } from "../organisms/ProductCard";

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
export function ProductQuickView({
  product,
  open,
  onOpenChange,
  container,
  onAddToCart,
}: ProductQuickViewProps) {
  const [dims, setDims] = React.useState<{ width: number; height: number }>({
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
    } as React.CSSProperties;
  }, [dims]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="relative p-0"
        style={style}
        data-cy="quick-view"
      >
        <Button
          variant="outline"
          className="absolute end-2 top-2 px-2 py-1 text-xs"
          aria-label="Close" // i18n-exempt: accessible label for close action
          data-cy="close-quick-view"
          onClick={() => onOpenChange(false)}
        >
          {/* i18n-exempt: microcopy for close button */}
          Close
        </Button>
        <ProductCard
          product={product}
          onAddToCart={onAddToCart}
          className="h-full w-full overflow-auto"
        />
      </DialogContent>
    </Dialog>
  );
}

export default ProductQuickView;
