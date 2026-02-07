"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] XA theme palette uses legacy patterns pending design/i18n overhaul */

import * as React from "react";
import Link from "next/link";
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";

import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";
import { Button, Price, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/atoms";
import { PriceCluster } from "@acme/design-system/molecules";

import { XA_PRODUCTS } from "../lib/demoData";
import type { XaProduct } from "../lib/demoData";
import { useCart } from "../contexts/XaCartContext";
import { useWishlist } from "../contexts/XaWishlistContext";
import { getAvailableStock } from "../lib/inventoryStore";
import { XA_COLOR_SWATCHES, formatLabel } from "../lib/xaCatalog";
import { XaFadeImage } from "./XaFadeImage";

export function XaBuyBox({ product }: { product: XaProduct }) {
  const [cart, dispatch] = useCart();
  const [wishlist, wishlistDispatch] = useWishlist();
  const [currency] = useCurrency();

  const [size, setSize] = React.useState<string>(product.sizes[0] ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const isWishlisted = wishlist.includes(product.id);
  const sizeCount = product.sizes.length;
  const showSizeSelect = sizeCount > 1;
  const colorOptions = product.taxonomy.color
    ? Array.from(new Set(product.taxonomy.color))
    : [];
  const colorMedia = product.media.filter((media) => media.type === "image" && media.url.trim());
  const variantProducts = React.useMemo(() => {
    if (!product.variantGroup) return [];
    const items = XA_PRODUCTS.filter((item) => item.variantGroup === product.variantGroup);
    return items.sort((a, b) => (a.id === product.id ? -1 : b.id === product.id ? 1 : 0));
  }, [product.id, product.variantGroup]);
  const showVariantStrip = variantProducts.length > 1;
  const showColorStrip = !showVariantStrip && colorOptions.length > 1;
  const sizeNote = sizeCount <= 1
    ? "One Size available" // i18n-exempt -- XA-0041: demo PDP copy
    : null;

  const availableToAdd = React.useMemo(
    () => getAvailableStock(product, cart),
    [cart, product],
  );
  const soldOut = availableToAdd <= 0;

  const addToCart = async () => {
    setError(null);
    try {
      await dispatch({
        type: "add",
        sku: product,
        size: product.sizes.length ? size : undefined,
        qty: 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cart update failed"); // i18n-exempt -- XA-0009: demo fallback error message
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <PriceCluster
          price={product.price}
          compare={product.compareAtPrice}
          currency={currency}
          className="xa-pdp-price"
        />
        {product.compareAtPrice && product.compareAtPrice > product.price ? (
          <div className="text-sm text-muted-foreground">
            Save{" "}
            <Price
              amount={Math.max(0, product.compareAtPrice - product.price)}
              currency={currency}
              className="font-medium"
            />
          </div>
        ) : null}
      </div>

      {showSizeSelect ? (
        <div className="space-y-2">
          <div className="xa-pdp-label text-muted-foreground">
            Size
          </div>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger className="w-full rounded-none">
              <SelectValue aria-label={size} />
            </SelectTrigger>
            <SelectContent>
              {product.sizes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sizeNote ? (
            <div className="xa-pdp-meta text-muted-foreground">{sizeNote}</div>
          ) : null}
        </div>
      ) : (
        sizeNote ? <div className="xa-pdp-meta text-muted-foreground">{sizeNote}</div> : null
      )}

      {error ? (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          className="xa-pdp-action flex-[2] h-11 rounded-none bg-black text-white hover:bg-neutral-900"
          disabled={soldOut}
          onClick={() => void addToCart()}
        >
          Add To Bag
        </Button>
        <Button
          variant="outline"
          className="xa-pdp-action h-11 w-11 min-w-11 rounded-none border-black text-black hover:bg-black hover:text-white"
          aria-pressed={isWishlisted}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => wishlistDispatch({ type: "toggle", sku: product })}
        >
          {isWishlisted ? (
            <HeartFilledIcon className="h-4 w-4" />
          ) : (
            <HeartIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {soldOut ? (
        <div className="xa-pdp-meta text-muted-foreground">Out of stock.</div>
      ) : null}

      <div className="space-y-2">
        <div className="xa-pdp-label text-muted-foreground">
          Estimated delivery
        </div>
        <div className="xa-pdp-meta">Jan 5 - Jan 12</div>
      </div>

      {showVariantStrip || showColorStrip ? (
        <div className="space-y-2">
          <div className="xa-pdp-label text-muted-foreground">
            Also available in
          </div>
          {showVariantStrip ? (
            <div className="flex gap-2">
              {variantProducts.map((variant) => {
                const color = variant.taxonomy.color?.[0] ?? "";
                const label = color ? formatLabel(color) : variant.title;
                const swatch = color ? (XA_COLOR_SWATCHES[color] ?? "#e5e5e5") : "#e5e5e5";
                const media = variant.media.find((item) => item.type === "image" && item.url.trim());
                const isCurrent = variant.id === product.id;
                return (
                  <Link
                    key={`${variant.slug}-variant`}
                    href={`/products/${variant.slug}`}
                    className={`relative h-12 w-12 overflow-hidden rounded-none border bg-white ${isCurrent ? "border-black" : "border-border-2"}`}
                    title={label}
                    aria-label={label}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {media ? (
                      <XaFadeImage
                        src={media.url}
                        alt={label}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <span
                        className="absolute inset-0"
                        style={{ backgroundColor: swatch }}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-2">
              {colorOptions.map((color, idx) => {
                const swatch = XA_COLOR_SWATCHES[color] ?? "#e5e5e5";
                const media = colorMedia[idx % Math.max(1, colorMedia.length)];
                return (
                  <div
                    key={`${product.slug}-color-${color}`}
                    className="relative h-12 w-12 overflow-hidden rounded-none border border-border-2 bg-white"
                    title={formatLabel(color)}
                  >
                    {media ? (
                      <XaFadeImage
                        src={media.url}
                        alt={formatLabel(color)}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <span
                        className="absolute inset-0"
                        style={{ backgroundColor: swatch }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      <div className="xa-pdp-meta rounded-none bg-muted/60 px-4 py-3 text-foreground">
        Free returns for 30 days | We can collect from your home
      </div>
    </div>
  );
}
