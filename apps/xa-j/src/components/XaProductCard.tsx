"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy product card pending design/i18n overhaul */

import Link from "next/link";
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";

import { IconButton, Price } from "@ui/components/atoms";
import { ProductBadge } from "@ui/components/atoms";
import { Cluster } from "@ui/components/atoms/primitives/Cluster";
import { Inline } from "@ui/components/atoms/primitives/Inline";
import { XaFadeImage } from "./XaFadeImage";
import type { XaProduct } from "../lib/demoData";
import { useCart } from "../contexts/XaCartContext";
import { useWishlist } from "../contexts/XaWishlistContext";
import { getAvailableStock } from "../lib/inventoryStore";
import { formatLabel, getDesignerName } from "../lib/xaCatalog";

export function XaProductCard({ product }: { product: XaProduct }) {
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
    <div className="xa-panel rounded-lg border border-border-1 bg-surface-2/60 p-4 shadow-elevation-1 backdrop-blur">
      <div className="relative">
        <Link href={`/products/${product.slug}`} className="group block">
          <div className="relative aspect-square overflow-hidden rounded-md bg-white">
            {primaryImage ? (
              <>
                <XaFadeImage
                  src={primaryImage.url}
                  alt={primaryImage.altText ?? product.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                {secondaryImage ? (
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <XaFadeImage
                      src={secondaryImage.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
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
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
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
                <button
                  key={`${product.slug}-size-${size}`}
                  type="button"
                  className="rounded-full border px-2 py-1 text-[11px] font-medium hover:bg-muted"
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
                </button>
              ))}
            </Inline>
          </div>
        ) : null}

      </div>
    </div>
  );
}
