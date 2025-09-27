"use client";
import Image from "next/image";
import * as React from "react";
import type { SKU } from "@acme/types";
import { useCart } from "@acme/platform-core/contexts/CartContext";
import { boxProps } from "../../utils/style";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { useTranslations } from "@acme/i18n";

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
      ctaLabel,
      padding = "p-4",
      width,
      height,
      margin,
      className,
      ...props
    },
    ref
  ) => {
    const t = useTranslations();
    const { classes, style } = boxProps({ width, height, padding, margin });
    const media = product.media?.[0];
    const [, dispatch] = useCart();

    const handleAdd = () => {
      if (onAddToCart) {
        onAddToCart(product);
      } else {
        void dispatch({ type: "add", sku: product });
      }
    };
    // i18n-exempt: viewports expression and className strings below are CSS-only
    const SIZES = "(min-width: 640px) 25vw, 50vw"; // i18n-exempt with justification: responsive image sizes string
    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          "flex flex-col gap-3 rounded-lg border", // i18n-exempt with justification: CSS utility classes only
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
                sizes={SIZES}
                className="rounded-md object-cover" /* i18n-exempt: CSS utility classes only */
              />
            ) : (
              <video
                src={media.url ?? ""}
                className="h-full w-full rounded-md object-cover" /* i18n-exempt: CSS utility classes only */
                data-aspect="1/1"
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
        <Button onClick={handleAdd}>{ctaLabel ?? (t("product.addToCart") as string)}</Button>
      </div>
    );
  }
);
ProductCard.displayName = "ProductCard";
