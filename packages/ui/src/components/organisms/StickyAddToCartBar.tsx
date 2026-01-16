"use client"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: Next.js directive string
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import type { SKU } from "@acme/types";
import { useTranslations } from "@acme/i18n";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@acme/i18n/resolveText";

export interface StickyAddToCartBarProps extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU;
  onAddToCart?: (product: SKU) => void;
  ctaLabel?: TranslatableText;
  /** Override default padding classes. */
  padding?: string;
  /** Optional current locale used for inline values */
  locale?: Locale;
}

/**
 * Sticky bottom bar showing product info and an add-to-cart button.
 */
export function StickyAddToCartBar({ product, onAddToCart, ctaLabel, padding = "p-4", className, locale, ...props }: StickyAddToCartBarProps) {
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
  const label = ((): string => {
    if (!ctaLabel) return t("actions.addToCart") as string;
    if (typeof ctaLabel === "string") return ctaLabel;
    if (ctaLabel.type === "key") return t(ctaLabel.key, ctaLabel.params) as string;
    if (ctaLabel.type === "inline") return resolveText(ctaLabel, (locale ?? "en"), t);
    return t("actions.addToCart") as string;
  })();
  // Base container classes
  const BAR_BASE_CLASSES = [
    // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: CSS utility classes only
    "sticky",
    "end-0",
    "bottom-0",
    "start-0",
    "flex",
    "items-center",
    "justify-between",
    "gap-4",
    "border-t",
    "bg-bg",
    "shadow-elevation-2",
  ].join(" ");
  return (
    <div
      className={cn(
        BAR_BASE_CLASSES,
        padding,
        className
      )}
      data-token="--color-bg" // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: design token literal
      {...props}
    >
      <div className="flex flex-col">{/* i18n-exempt -- I18N-0001 [ttl=2026-01-31]: CSS utility classes only */}
        <span className="text-sm">{product.title ?? ""}</span>
        {product.price != null && (
          <Price amount={product.price} className="font-semibold" />
        )}
      </div>
      {onAddToCart && (
        <Button onClick={() => onAddToCart(product)}>{label}</Button>
      )}
    </div>
  );
}
