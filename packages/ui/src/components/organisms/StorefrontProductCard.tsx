import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "../../utils/style";
import { Price } from "../atoms/Price";
import { ProductBadge } from "../atoms/ProductBadge";

export interface StorefrontProductCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  href: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  images: Array<{ src: string; alt?: string }>;
}

export function StorefrontProductCard({
  href,
  title,
  price,
  compareAtPrice,
  currency,
  images,
  className,
  ...props
}: StorefrontProductCardProps) {
  const hasDiscount =
    typeof compareAtPrice === "number" && compareAtPrice > price;
  const discountPct = hasDiscount
    ? Math.round(100 - (price / compareAtPrice!) * 100)
    : 0;
  const saving = hasDiscount ? compareAtPrice! - price : 0;

  // i18n-exempt -- XA-0004: CSS-only strings
  const CARD_CLASS = "rounded-lg border p-4";
  const primary = images[0];
  const secondary = images[1];
  const SIZES = "(min-width: 768px) 25vw, 50vw"; // i18n-exempt -- responsive sizes string

  return (
    <div className={cn(CARD_CLASS, className)} {...props}>
      <Link href={href} className="group block">
        <div className="relative aspect-square overflow-hidden rounded-md">
          {primary ? (
            <Image
              src={primary.src}
              alt={primary.alt ?? title}
              fill
              sizes={SIZES}
              className={cn(
                "object-cover",
                secondary ? "transition-opacity group-hover:opacity-0" : "",
              )}
            />
          ) : null}
          {secondary ? (
            <Image
              src={secondary.src}
              alt={secondary.alt ?? title}
              fill
              sizes={SIZES}
              className="object-cover opacity-0 transition-opacity group-hover:opacity-100"
            />
          ) : null}

          {hasDiscount ? (
            <div className="absolute start-2 top-2">
              <ProductBadge
                label={`${discountPct}% OFF`} // i18n-exempt -- XA-0005: demo badge label
                variant="sale"
                size="sm"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-3 space-y-1">
          <div className="text-sm font-medium">{title}</div>
          <div className="flex items-baseline gap-2">
            <Price amount={price} currency={currency} className="font-semibold" />
            {hasDiscount ? (
              <Price
                amount={compareAtPrice!}
                currency={currency}
                className="text-sm text-muted-foreground line-through"
              />
            ) : null}
          </div>
          {hasDiscount ? (
            <div className="text-xs text-muted-foreground">
              Save{" "}
              <Price amount={saving} currency={currency} className="font-medium" />
            </div>
          ) : null}
        </div>
      </Link>
    </div>
  );
}
