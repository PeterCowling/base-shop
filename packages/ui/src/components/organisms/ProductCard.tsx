"use client"; // i18n-exempt -- DEV-000: Next.js directive, not user-facing
import Image from "next/image";
import * as React from "react";
import type { SKU } from "@acme/types";
import { useCart } from "@acme/platform-core/contexts/CartContext";
import { boxProps } from "../../utils/style";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { useTranslations } from "@acme/i18n";

import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@i18n/resolveText";

export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU;
  onAddToCart?: (product: SKU) => void;
  showImage?: boolean;
  showPrice?: boolean;
  ctaLabel?: TranslatableText;
  /** Override default padding classes. */
  padding?: string;
  /** Optional width */
  width?: string | number;
  /** Optional height */
  height?: string | number;
  /** Optional margin classes */
  margin?: string;
  /** Optional current locale used for inline values */
  locale?: Locale;
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
      locale,
      className,
      ...props
    },
    ref
  ) => {
    const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
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
    // i18n-exempt -- DEV-000: viewports expression and className strings below are CSS-only
    const SIZES = "(min-width: 640px) 25vw, 50vw"; // i18n-exempt -- DEV-000: responsive image sizes string
    return (
      <div
        ref={ref}
        /* eslint-disable-next-line react/forbid-dom-props -- UI-2610: Controlled numeric width/height fallback from boxProps; prefer Tailwind classes when possible */
        style={style}
        className={cn(
          "flex flex-col gap-3 rounded-lg border", // i18n-exempt -- DEV-000: CSS utility classes only
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
        <Button onClick={handleAdd}>{
          (() => {
            if (!ctaLabel) return t("Add to cart") as string;
            if (typeof ctaLabel === "string") return ctaLabel;
            if (ctaLabel.type === "key") return t(ctaLabel.key, ctaLabel.params) as string;
            if (ctaLabel.type === "inline") return resolveText(ctaLabel, (locale ?? "en"), t);
            return t("Add to cart") as string;
          })()
        }</Button>
      </div>
    );
  }
);
ProductCard.displayName = "ProductCard";
