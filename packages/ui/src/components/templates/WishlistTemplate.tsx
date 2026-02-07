"use client";
import * as React from "react";
import Image from "next/image";

import { useTranslations } from "@acme/i18n";
import type { SKU } from "@acme/types";

import { cn } from "../../utils/style";
import { Price } from "../atoms/Price";
import { Inline } from "../atoms/primitives";
import { Button } from "../atoms/shadcn";

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
  ctaAddToCartLabel: addProp,
  ctaRemoveLabel: removeProp,
  className,
  ...props
}: WishlistTemplateProps) {
  const t = useTranslations();
  const ctaAddToCartLabel = addProp ?? t("actions.addToCart");
  const ctaRemoveLabel = removeProp ?? t("actions.remove");
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <h2 className="text-xl font-semibold">{t("wishlist.title")}</h2>
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
                      data-aspect="1/1"
                      muted
                      playsInline
                    />
                  )}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium">{item.title}</h3>
                <Inline className="text-muted-foreground text-sm" alignY="center" gap={2}>
                  {typeof item.price === "number" && <Price amount={item.price} />}
                  {item.quantity !== undefined && (
                    // i18n-exempt quantity multiplier symbol
                    <span>x{item.quantity}</span>
                  )}
                </Inline>
              </div>
              <Inline gap={2}>
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
              </Inline>
            </div>
          );
        })}
      </div>
    </div>
  );
}
