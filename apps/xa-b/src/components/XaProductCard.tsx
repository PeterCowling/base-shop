"use client";


import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";

import { Button, IconButton, Price, ProductBadge } from "@acme/design-system/atoms";
import { Cluster } from "@acme/design-system/primitives/Cluster";
import { Inline } from "@acme/design-system/primitives/Inline";
import { cn } from "@acme/design-system/utils/style";
import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";

import { useCart } from "../contexts/XaCartContext";
import { useWishlist } from "../contexts/XaWishlistContext";
import type { XaProduct } from "../lib/demoData";
import { getAvailableStock } from "../lib/inventoryStore";
import { formatLabel, getDesignerName, getEffectivePrice, isProductImage } from "../lib/xaCatalog";
import { xaI18n } from "../lib/xaI18n";
import { isNewIn } from "../lib/xaListingUtils";
import { getProductHref } from "../lib/xaRoutes";

import { XaFadeImage } from "./XaFadeImage";

const CART_ERROR_OUT_OF_STOCK = "Out of stock"; // i18n-exempt -- XA-0143 [ttl=2026-12-31] internal cart error code
const CART_ERROR_SIZE_REQUIRED = "Size is required"; // i18n-exempt -- XA-0143 [ttl=2026-12-31] internal cart error code

export function XaProductCard({ product }: { product: XaProduct }) {
  const [touched, setTouched] = useState(false);
  const [quickAddFeedback, setQuickAddFeedback] = useState<{
    tone: "error" | "success";
    message: string;
  } | null>(null);
  const [cart, dispatch] = useCart();
  const [wishlist, wishlistDispatch] = useWishlist();
  const [currency] = useCurrency();
  const images = useMemo(() => product.media.filter(isProductImage), [product.media]);
  const primaryImage = images[0];
  const secondaryImage = images[1];
  const soldOut = getAvailableStock(product, cart) <= 0;
  const designerName = getDesignerName(product.brand);
  const category = product.taxonomy.category;
  const isWishlisted = wishlist.includes(product.id);
  const effectivePrice = getEffectivePrice(product, currency);

  const jewelryDetail = useMemo(() => {
    if (category !== "jewelry") return null;
    const metal = product.taxonomy.metal ? formatLabel(product.taxonomy.metal) : null;
    const gemstone = product.taxonomy.gemstone && product.taxonomy.gemstone !== "none"
      ? formatLabel(product.taxonomy.gemstone)
      : null;
    const size = product.taxonomy.jewelrySize ? formatLabel(product.taxonomy.jewelrySize) : null;
    return [metal, gemstone ?? size].filter(Boolean).join(" / ");
  }, [category, product.taxonomy]);

  useEffect(() => {
    if (!quickAddFeedback) return;
    const timer = window.setTimeout(() => setQuickAddFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [quickAddFeedback]);

  const toQuickAddErrorMessage = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    if (message === CART_ERROR_OUT_OF_STOCK) {
      return xaI18n.t("xaB.src.components.xaproductcard.quickadd.outofstock");
    }
    if (message === CART_ERROR_SIZE_REQUIRED) {
      return xaI18n.t("xaB.src.components.xaproductcard.quickadd.sizerequired");
    }
    return xaI18n.t("xaB.src.components.xaproductcard.quickadd.failed");
  }, []);

  const handleQuickAdd = useCallback(async (size: string) => {
    setQuickAddFeedback(null);
    try {
      await dispatch({
        type: "add",
        sku: product,
        size,
        qty: 1,
      });
      setQuickAddFeedback({
        tone: "success",
        message: xaI18n.t("xaB.src.components.xaproductcard.quickadd.added"),
      });
    } catch (error) {
      setQuickAddFeedback({
        tone: "error",
        message: toQuickAddErrorMessage(error),
      });
    }
  }, [product, dispatch, toQuickAddErrorMessage]);

  return (
    <div className="xa-panel rounded-sm border border-border-1 bg-surface-2 p-4 shadow-elevation-1">
      <div className="relative">
        <Link href={getProductHref(product.slug)} className="group block">
          <div className="relative aspect-square overflow-hidden rounded-sm bg-surface" onTouchStart={() => setTouched(true)} onTouchEnd={() => setTouched(false)}>
            {primaryImage ? (
              <>
                <XaFadeImage
                  src={primaryImage.url}
                  alt={primaryImage.altText ?? product.title}
                  fill
                  sizes={xaI18n.t("xaB.src.components.xaproductcard.l62c25")}
                  className={cn("object-cover transition-opacity duration-300 group-hover:opacity-0", touched ? "opacity-0" : "")}
                />
                {secondaryImage ? (
                  <div className={cn("absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100", touched ? "opacity-100" : "")}>
                    <XaFadeImage
                      src={secondaryImage.url}
                      alt=""
                      fill
                      sizes={xaI18n.t("xaB.src.components.xaproductcard.l71c29")}
                      className="object-cover"
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <Cluster
                alignY="center"
                justify="center"
                wrap={false}
                className="h-full w-full text-sm text-muted-foreground"
              >
                {product.title}
              </Cluster>
            )}
            {soldOut ? (
              <div className="absolute start-2 top-2">
                <ProductBadge
                  label="Sold out" // i18n-exempt -- XA-0022: demo badge label
                  color="default"
                  tone="solid"
                  size="sm"
                />
              </div>
            ) : isNewIn(product) ? (
              <div className="absolute start-2 top-2">
                <ProductBadge
                  label="New In" // i18n-exempt -- XA-0022: demo badge label
                  color="default"
                  tone="soft"
                  size="sm"
                />
              </div>
            ) : null}
          </div>
        </Link>

        <div className="absolute end-2 top-2">
          <IconButton
            aria-label={isWishlisted ? xaI18n.t("xaB.src.components.xaproductcard.l110c40") : xaI18n.t("xaB.src.components.xaproductcard.l110c65")}
            aria-pressed={isWishlisted}
            variant="secondary"
            size="sm"
            onClick={(event) => {
              event.preventDefault();
              wishlistDispatch({ type: "toggle", sku: product });
            }}
          >
            {isWishlisted ? (
              <HeartFilledIcon className="h-4 w-4" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
          </IconButton>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <Link href={getProductHref(product.slug)} className="block space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide">
            {designerName}
          </div>
          <div className="text-sm text-muted-foreground">{product.title}</div>
          <Price amount={effectivePrice} className="font-semibold" />
        </Link>

        {category === "jewelry" && jewelryDetail ? (
          <div className="text-xs text-muted-foreground">{jewelryDetail}</div>
        ) : null}

        {category === "clothing" && product.sizes.length ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {xaI18n.t("xaB.src.components.xaproductcard.quickadd.label")}
            </div>
            <Inline gap={2} wrap>
              {product.sizes.map((size) => (
                <Button
                  key={`${product.slug}-size-${size}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-0 rounded-full border px-2 py-1 xa-text-11 font-medium hover:bg-muted"
                  onClick={(event) => {
                    event.preventDefault();
                    void handleQuickAdd(size);
                  }}
                >
                  {size}
                </Button>
              ))}
            </Inline>
            {quickAddFeedback ? (
              <p
                role={quickAddFeedback.tone === "error" ? "alert" : "status"}
                aria-live="polite"
                className={cn(
                  "text-xs",
                  quickAddFeedback.tone === "error"
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {quickAddFeedback.message}
              </p>
            ) : null}
          </div>
        ) : null}

      </div>
    </div>
  );
}
