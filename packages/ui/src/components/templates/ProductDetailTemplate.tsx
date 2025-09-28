"use client"; // i18n-exempt -- DEV-000: Next.js directive, not user-facing
import Image from "next/image";
import * as React from "react";
import { useTranslations } from "@acme/i18n";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { ProductBadge } from "../atoms/ProductBadge";
import type { SKU } from "@acme/types";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@i18n/resolveText";
import { Stack, Inline } from "../atoms/primitives";

export interface ProductDetailTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU & {
    badges?: { label: string; variant?: "default" | "sale" | "new" }[];
  };
  onAddToCart?: (product: SKU) => void;
  ctaLabel?: TranslatableText;
  locale?: Locale;
}

export function ProductDetailTemplate({
  product,
  onAddToCart,
  ctaLabel: ctaLabelProp,
  locale = "en",
  className,
  ...props
}: ProductDetailTemplateProps) {
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
  const ctaLabel = (() => {
    if (!ctaLabelProp) {
      return t("actions.addToCart");
    }
    if (typeof ctaLabelProp === "string") return ctaLabelProp;
    if (ctaLabelProp.type === "key") return t(ctaLabelProp.key, ctaLabelProp.params);
    if (ctaLabelProp.type === "inline") return resolveText(ctaLabelProp, locale, t);
    return t("actions.addToCart");
  })();
  const firstMedia = product.media?.[0];
  const gridLayout = "grid gap-6 md:grid-cols-2"; // i18n-exempt -- DEV-000: layout class names
  const mediaClass = "rounded-md object-cover"; // i18n-exempt -- DEV-000: style tokens
  const imgSizes = "(min-width: 768px) 50vw, 100vw"; // i18n-exempt -- DEV-000: media attribute
  const mediaBase = "h-full w-full"; // i18n-exempt -- DEV-000: style tokens
  return (
    <div className={cn(gridLayout, className)} {...props}>
      {firstMedia?.url && (
        <div className="relative aspect-square w-full">
          {firstMedia.type === "image" ? (
            <Image
              src={firstMedia.url}
              alt={product.title ?? ""}
              fill
              sizes={imgSizes}
              className={mediaClass}
            />
          ) : (
            <video
              src={firstMedia.url}
              className={cn(mediaBase, mediaClass)}
              data-aspect="1/1"
              muted
              playsInline
            />
          )}
        </div>
      )}
      <Stack gap={4}>
        <h2 className="text-2xl font-semibold">{product.title}</h2>
        {product.badges && (
          <Inline gap={2}>
            {product.badges.map(
              (
                b: { label: string; variant?: "default" | "sale" | "new" }
              ) => (
                <ProductBadge
                  key={`${b.label}-${b.variant ?? "default"}`}
                  label={b.label}
                  variant={b.variant}
                />
              )
            )}
          </Inline>
        )}
        {typeof product.price === "number" && (
          <Price amount={product.price} className="text-xl font-bold" />
        )}
        {product.description && <p>{product.description}</p>}
        {onAddToCart && (
          <Button onClick={() => onAddToCart(product)}>{ctaLabel}</Button>
        )}
      </Stack>
    </div>
  );
}
