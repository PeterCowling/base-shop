"use client"; // i18n-exempt -- DEV-000: Next.js directive, not user-facing
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { ProductQuickView } from "../overlays/ProductQuickView";
import type { SKU } from "@acme/types";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";
import { ProductCard } from "./ProductCard";
import { useTranslations } from "@acme/i18n";

export type Product = SKU;

export interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: SKU[];
  /**
   * Explicit number of columns. If omitted, the grid will
   * determine a responsive column count within the
   * `minItems`/`maxItems` range based on its width.
   */
  columns?: number;
  /** Minimum number of items to show */
  minItems?: number;
  /** Maximum number of items to show */
  maxItems?: number;
  /** Items shown on desktop viewports */
  desktopItems?: number;
  /** Items shown on tablet viewports */
  tabletItems?: number;
  /** Items shown on mobile viewports */
  mobileItems?: number;
  showImage?: boolean;
  showPrice?: boolean;
  ctaLabel?: TranslatableText;
  onAddToCart?: (product: SKU) => void;
  /** Show quick view trigger for each product */
  enableQuickView?: boolean;
  /** Optional current locale used for inline values */
  locale?: Locale;
}

export function ProductGrid({
  products,
  columns,
  minItems = 1,
  maxItems = 4,
  desktopItems,
  tabletItems,
  mobileItems,
  showImage = true,
  showPrice = true,
  ctaLabel,
  onAddToCart,
  enableQuickView = false,
  className,
  locale,
  ...props
}: ProductGridProps) {
  const t = useTranslations();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cols, setCols] = React.useState(
    columns ?? desktopItems ?? minItems
  );
  const [quickViewProduct, setQuickViewProduct] = React.useState<SKU | null>(
    null
  );

  React.useEffect(() => {
    if (columns || typeof ResizeObserver === "undefined" || !containerRef.current)
      return;
    const el = containerRef.current;
    const ITEM_WIDTH = 250;
    const update = () => {
      const width = el.clientWidth;
      if (desktopItems || tabletItems || mobileItems) {
        const chosen =
          width >= 1024
            ? desktopItems
            : width >= 768
            ? tabletItems
            : mobileItems;
        setCols(chosen ?? minItems);
        return;
      }
      const ideal = Math.floor(width / ITEM_WIDTH) || 1;
      const clamped = Math.max(minItems, Math.min(maxItems, ideal));
      setCols(clamped);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    columns,
    minItems,
    maxItems,
    desktopItems,
    tabletItems,
    mobileItems,
  ]);

  const style = {
    gridTemplateColumns: `repeat(${columns ?? cols}, minmax(0, 1fr))`,
  } as React.CSSProperties;
  return (
    <>
      <div
        ref={containerRef}
        className={cn("grid gap-6", className)} // i18n-exempt -- DEV-000: CSS utility classes only
        /* eslint-disable-next-line react/forbid-dom-props -- UI-2610: Grid template columns depend on runtime container width; requires inline style */
        style={style}
        {...props}
      >
        {products.map((p) => (
          <div key={p.id} className="relative">
            <ProductCard
              product={p}
              onAddToCart={onAddToCart}
              showImage={showImage}
              showPrice={showPrice}
              ctaLabel={ctaLabel}
              locale={locale}
            />
            {enableQuickView && (
              <Button
                variant="outline" /* i18n-exempt -- DEV-000: enum-like prop, not user-facing copy */
                className="absolute end-2 top-2 h-8 px-2"
                aria-label={`${t("product.quickView") as string} ${p.title ?? ""}`}
                onClick={() => setQuickViewProduct(p)}
              >
                {t("product.quickView") as string}
              </Button>
            )}
          </div>
        ))}
      </div>
      {enableQuickView && quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          open={!!quickViewProduct}
          onOpenChange={(o) => !o && setQuickViewProduct(null)}
          container={containerRef.current}
          onAddToCart={onAddToCart}
        />
      )}
    </>
  );
}
