"use client";


import { useState } from "react";
import Link from "next/link";
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";

import { Button, IconButton, Price, ProductBadge } from "@acme/design-system/atoms";
import { Cluster } from "@acme/design-system/primitives/Cluster";
import { Inline } from "@acme/design-system/primitives/Inline";
import { cn } from "@acme/design-system/utils/style";

import { useCart } from "../contexts/XaCartContext";
import { useWishlist } from "../contexts/XaWishlistContext";
import type { XaProduct } from "../lib/demoData";
import { getAvailableStock } from "../lib/inventoryStore";
import { formatLabel, getDesignerName } from "../lib/xaCatalog";
import { xaI18n } from "../lib/xaI18n";

import { XaFadeImage } from "./XaFadeImage";

export function XaProductCard({ product }: { product: XaProduct }) {
  const [touched, setTouched] = useState(false);
  const [cart, dispatch] = useCart();
  const [wishlist, wishlistDispatch] = useWishlist();
  const images = product.media.filter((m) => m.type === "image" && m.url.trim());
  const primaryImage = images[0];
  const secondaryImage = images[1];
  const soldOut = getAvailableStock(product, cart) <= 0;
  const designerName = getDesignerName(product.brand);
  const category = product.taxonomy.category;
  const isWishlisted = wishlist.includes(product.id);

  const hasDiscount =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(100 - (product.price / product.compareAtPrice!) * 100)
    : 0;
  const saving = hasDiscount ? product.compareAtPrice! - product.price : 0;

  const jewelryDetail = (() => {
    if (category !== "jewelry") return null;
    const metal = product.taxonomy.metal ? formatLabel(product.taxonomy.metal) : null;
    const gemstone = product.taxonomy.gemstone && product.taxonomy.gemstone !== "none"
      ? formatLabel(product.taxonomy.gemstone)
      : null;
    const size = product.taxonomy.jewelrySize ? formatLabel(product.taxonomy.jewelrySize) : null;
    return [metal, gemstone ?? size].filter(Boolean).join(" / ");
  })();

  return (
    <div className="xa-panel rounded-sm border border-border-1 bg-surface-2 p-4 shadow-elevation-1">
      <div className="relative">
        <Link href={`/products/${product.slug}`} className="group block">
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
            ) : hasDiscount ? (
              <div className="absolute start-2 top-2">
                <ProductBadge
                  label={`${discountPct}% OFF`} // i18n-exempt -- XA-0005: demo badge label
                  variant="sale"
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
        <Link href={`/products/${product.slug}`} className="block space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide">
            {designerName}
          </div>
          <div className="text-sm text-muted-foreground">{product.title}</div>
          <Inline gap={2} alignY="baseline" wrap={false}>
            <Price amount={product.price} className="font-semibold" />
            {hasDiscount ? (
              <Price
                amount={product.compareAtPrice!}
                className="text-sm text-muted-foreground line-through"
              />
            ) : null}
          </Inline>
        </Link>

        {hasDiscount ? (
          <div className="text-xs text-muted-foreground">
            Save <Price amount={saving} className="font-medium" />
          </div>
        ) : null}

        {category === "bags" && product.taxonomy.sizeClass ? (
          <div className="text-xs text-muted-foreground">
            Size class: {formatLabel(product.taxonomy.sizeClass)}
          </div>
        ) : null}

        {category === "jewelry" && jewelryDetail ? (
          <div className="text-xs text-muted-foreground">{jewelryDetail}</div>
        ) : null}

        {category === "clothing" && product.sizes.length ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quick add
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
                    void dispatch({
                      type: "add",
                      sku: product,
                      size,
                      qty: 1,
                    }).catch(() => {});
                  }}
                >
                  {size}
                </Button>
              ))}
            </Inline>
          </div>
        ) : null}

      </div>
    </div>
  );
}
