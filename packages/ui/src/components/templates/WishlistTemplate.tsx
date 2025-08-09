import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import type { Product } from "../organisms/ProductCard";

export interface WishlistItem extends Product {
  quantity?: number;
}

export interface WishlistTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  items: WishlistItem[];
  onAddToCart?: (item: WishlistItem) => void;
  onRemove?: (item: WishlistItem) => void;
  ctaAddToCartLabel?: string;
  ctaRemoveLabel?: string;
}

export function WishlistTemplate({
  items,
  onAddToCart,
  onRemove,
  ctaAddToCartLabel = "Add to cart",
  ctaRemoveLabel = "Remove",
  className,
  ...props
}: WishlistTemplateProps) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <h2 className="text-xl font-semibold">Wishlist</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 border-b pb-4 last:border-b-0"
          >
            <div className="relative h-16 w-16 shrink-0">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="64px"
                className="rounded object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{item.title}</h3>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Price amount={item.price} />
                {item.quantity !== undefined && <span>x{item.quantity}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {onAddToCart && (
                <Button onClick={() => onAddToCart(item)}>
                  {ctaAddToCartLabel}
                </Button>
              )}
              {onRemove && (
                <Button variant="destructive" onClick={() => onRemove(item)}>
                  {ctaRemoveLabel}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
