import Image from "next/image";
import * as React from "react";
import { boxProps } from "../../utils/style";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { VideoPlayer } from "../atoms/VideoPlayer";
import type { MediaItem } from "@acme/types";

export interface Product {
  id: string;
  title: string;
  media: MediaItem[];
  price: number;
}

export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: Product;
  onAddToCart?: (product: Product) => void;
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
        {showImage && (
          <div className="relative aspect-square">
            {product.media?.[0]?.type === "video" ? (
              <VideoPlayer
                src={product.media[0].url}
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <Image
                src={product.media?.[0]?.url || ""}
                alt={product.title}
                fill
                sizes="(min-width: 640px) 25vw, 50vw"
                className="rounded-md object-cover"
              />
            )}
          </div>
        )}
        <h3 className="font-medium">{product.title}</h3>
        {showPrice && (
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
