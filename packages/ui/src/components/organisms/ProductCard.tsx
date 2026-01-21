"use client"; // i18n-exempt -- DEV-000: Next.js directive, not user-facing
import * as React from "react";
import Image from "next/image";

import { useTranslations } from "@acme/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@acme/i18n/resolveText";
import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";
import { useCart } from "@acme/platform-core/contexts/CartContext";
import type { SKU } from "@acme/types";
import type { TranslatableText } from "@acme/types/i18n";

import { boxProps , cn } from "../../utils/style";
import { Price } from "../atoms/Price";
import { Button } from "../atoms/shadcn";

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
  /** Optional min height to normalize tile heights across grids/carousels */
  minHeight?: string | number;
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
      minHeight,
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
      void logAnalyticsEvent({
        type: "add_to_cart",
        productId: product.id,
        source: "product_card",
      });
    };
    // i18n-exempt -- DEV-000: viewports expression and className strings below are CSS-only
    const SIZES = "(min-width: 640px) 25vw, 50vw"; // i18n-exempt -- DEV-000: responsive image sizes string
    return (
      <div
        ref={ref}
        /* eslint-disable-next-line react/forbid-dom-props -- UI-2610: Controlled numeric width/height fallback from boxProps; prefer Tailwind classes when possible */
        style={minHeight != null ? { ...style, minHeight } : style}
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
                onClick={() =>
                  logAnalyticsEvent({
                    type: "media_interaction",
                    productId: product.id,
                    action: "media_click",
                    mediaUrl: media.url,
                  })
                }
              />
            ) : (
              <video
                src={media.url ?? ""}
                className="h-full w-full rounded-md object-cover" /* i18n-exempt: CSS utility classes only */
                data-aspect="1/1"
                onClick={() =>
                  logAnalyticsEvent({
                    type: "media_interaction",
                    productId: product.id,
                    action: "media_click",
                    mediaUrl: media.url,
                  })
                }
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
            if (!ctaLabel) return t("actions.addToCart") as string;
            if (typeof ctaLabel === "string") return ctaLabel;
            if (ctaLabel.type === "key") return t(ctaLabel.key, ctaLabel.params) as string;
            if (ctaLabel.type === "inline") return resolveText(ctaLabel, (locale ?? "en"), t);
            return t("actions.addToCart") as string;
          })()
        }</Button>
      </div>
    );
  }
);
ProductCard.displayName = "ProductCard";
