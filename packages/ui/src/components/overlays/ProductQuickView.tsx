"use client"; // i18n-exempt: Next.js directive string, not user-facing copy
import * as React from "react";
import { Dialog, DialogContent, Button } from "../atoms/shadcn";
import type { SKU } from "@acme/types";
import { ProductCard } from "../organisms/ProductCard";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  // i18n-exempt: data-cy attributes are test-only and not user-facing
  const DCY_QUICK_VIEW = "quick-view" as const;
  // i18n-exempt: data-cy attributes are test-only and not user-facing
  const DCY_CLOSE_QUICK_VIEW = "close-quick-view" as const;
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
        data-cy={DCY_QUICK_VIEW}
      >
        <Button
          variant="outline" // i18n-exempt: UI variant token, not user-facing copy
          className="absolute end-2 top-2 px-2 py-1 text-xs"
          aria-label={t("Close") as string}
          data-cy={DCY_CLOSE_QUICK_VIEW}
          onClick={() => onOpenChange(false)}
        >
          {t("Close")}
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
