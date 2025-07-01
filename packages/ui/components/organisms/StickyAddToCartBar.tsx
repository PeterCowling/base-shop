import * as React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../atoms-shadcn";
import { Price } from "../atoms/Price";
import type { Product } from "./ProductCard";

export interface StickyAddToCartBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  product: Product;
  onAddToCart?: (product: Product) => void;
  ctaLabel?: string;
  /** Override default padding classes. */
  padding?: string;
}

/**
 * Sticky bottom bar showing product info and an add-to-cart button.
 */
export function StickyAddToCartBar({
  product,
  onAddToCart,
  ctaLabel = "Add to cart",
  padding = "p-4",
  className,
  ...props
}: StickyAddToCartBarProps) {
  return (
    <div
      className={cn(
        "sticky right-0 bottom-0 left-0 flex items-center justify-between gap-4 border-t bg-white shadow-md",
        padding,
        className
      )}
      {...props}
    >
      <div className="flex flex-col">
        <span className="text-sm">{product.title}</span>
        <Price amount={product.price} className="font-semibold" />
      </div>
      {onAddToCart && (
        <Button onClick={() => onAddToCart(product)}>{ctaLabel}</Button>
      )}
    </div>
  );
}
