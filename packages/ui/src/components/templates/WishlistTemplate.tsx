"use client";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import type { SKU } from "@acme/types";

export interface WishlistItem extends SKU {
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
        {items.map((item) => {
          const firstMedia = item.media?.[0];
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 border-b pb-4 last:border-b-0"
            >
              {firstMedia?.url && (
                <div className="relative h-16 w-16 shrink-0">
                  {firstMedia.type === "image" ? (
                    <Image
                      src={firstMedia.url}
                      alt={item.title ?? ""}
                      fill
                      sizes="64px"
                      className="rounded object-cover"
                    />
                  ) : (
                    <video
                      src={firstMedia.url}
                      className="h-full w-full rounded object-cover"
                      muted
                      playsInline
                    />
                  )}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium">{item.title}</h3>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  {typeof item.price === "number" && <Price amount={item.price} />}
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
          );
        })}
      </div>
    </div>
  );
}
