"use client"; // i18n-exempt -- DEV-000: Next.js directive, not user-facing
import * as React from "react";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { ProductBadge } from "../atoms/ProductBadge";
import type { MediaItem as GalleryMediaItem } from "../molecules/MediaSelector";
import type { SKU } from "@acme/types";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@i18n/resolveText";
import { ProductGallery } from "../organisms/ProductGallery";
import { Grid, Inline, Stack } from "../atoms/primitives";

export interface ProductMediaGalleryTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU & {
    badges?: { label: string; variant?: "default" | "sale" | "new" }[];
  };
  onAddToCart?: (product: SKU) => void;
  ctaLabel?: TranslatableText;
  locale?: Locale;
}

export function ProductMediaGalleryTemplate({
  product,
  onAddToCart,
  ctaLabel: ctaLabelProp,
  locale = "en",
  className,
  ...props
}: ProductMediaGalleryTemplateProps) {
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
  const galleryMedia: GalleryMediaItem[] = (product.media ?? [])
    .filter(
      (m): m is NonNullable<SKU["media"]>[number] & { url: string } =>
        !!m?.url
    )
    .map((m) => ({
      type: m.type as GalleryMediaItem["type"],
      src: m.url,
      alt: m.altText,
    }));
  // i18n-exempt -- DEV-000: class names
  const gridColsClass = "md:grid-cols-2";
  return (
    <Grid cols={1} gap={6} className={cn(gridColsClass, className)} {...props}>
      <ProductGallery media={galleryMedia} />
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
    </Grid>
  );
}
