import Image from "next/image";
import * as React from "react";
import type { SKU } from "@acme/types";
import { boxProps } from "../../utils/style";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";

export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU;
  onAddToCart?: (product: SKU) => void;
  showImage?: boolean;
  showPrice?: boolean;
  ctaLabel?: string;
  /** Override default padding classes. */
  padding?: string;
  /** Optional width */
  width?: string | number;
  /** Optional height */
  height?: string | number;
  /** Optional margin classes */
  margin?: string;
}

export const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      product,
      onAddToCart,
      showImage = true,
      showPrice = true,
      ctaLabel = "Add to cart",
      padding = "p-4",
      width,
      height,
      margin,
      className,
      ...props
    },
    ref
  ) => {
    const { classes, style } = boxProps({ width, height, padding, margin });
    const media = product.media?.[0];
    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          "flex flex-col gap-3 rounded-lg border",
          classes,
          className
        )}
        {...props}
      >
        {showImage && media && (
          <div className="relative aspect-square">
            {media.type === "image" ? (
              <Image
                src={media.url ?? ""}
                alt={media.altText ?? product.title ?? ""}
                fill
                sizes="(min-width: 640px) 25vw, 50vw"
                className="rounded-md object-cover"
              />
            ) : (
              <video
                src={media.url ?? ""}
                className="h-full w-full rounded-md object-cover"
                muted
                playsInline
              />
            )}
          </div>
        )}
        <h3 className="font-medium">{product.title ?? ""}</h3>
        {showPrice && product.price != null && (
          <Price amount={product.price} className="font-semibold" />
        )}
        {onAddToCart && (
          <Button onClick={() => onAddToCart(product)}>{ctaLabel}</Button>
        )}
      </div>
    );
  }
);
ProductCard.displayName = "ProductCard";
