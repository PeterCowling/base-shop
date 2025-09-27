"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import type { SKU } from "@acme/types";

export interface StickyAddToCartBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU;
  onAddToCart?: (product: SKU) => void;
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
        "sticky end-0 bottom-0 start-0 flex items-center justify-between gap-4 border-t bg-bg shadow-elevation-2",
        padding,
        className
      )}
      data-token="--color-bg"
      {...props}
    >
      <div className="flex flex-col">
        <span className="text-sm">{product.title ?? ""}</span>
        {product.price != null && (
          <Price amount={product.price} className="font-semibold" />
        )}
      </div>
      {onAddToCart && (
        <Button onClick={() => onAddToCart(product)}>{ctaLabel}</Button>
      )}
    </div>
  );
}
