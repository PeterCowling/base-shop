"use client";


import * as React from "react";
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";

import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/atoms";
import { PriceCluster } from "@acme/design-system/molecules";
import { Inline } from "@acme/design-system/primitives/Inline";
import { useCurrency } from "@acme/platform-core/contexts/CurrencyContext";

import { useCart } from "../contexts/XaCartContext";
import { useWishlist } from "../contexts/XaWishlistContext";
import type { XaProduct } from "../lib/demoData";
import { getAvailableStock } from "../lib/inventoryStore";
import { useXaCatalogSnapshot } from "../lib/liveCatalog";
import { formatLabel, getEffectivePrice, isProductImage, XA_COLOR_SWATCHES, XA_DEFAULT_SWATCH } from "../lib/xaCatalog";
import { xaI18n } from "../lib/xaI18n";
import { getProductHref } from "../lib/xaRoutes";

import { XaColorSwatchStrip } from "./XaColorSwatchStrip";

function getDeliveryWindow(daysMin = 5, daysMax = 12): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const now = new Date();
  const min = new Date(now);
  min.setDate(now.getDate() + daysMin);
  const max = new Date(now);
  max.setDate(now.getDate() + daysMax);
  return `${fmt(min)} – ${fmt(max)}`;
}

export function XaBuyBox({ product }: { product: XaProduct }) {
  const { products } = useXaCatalogSnapshot();
  const [cart, dispatch] = useCart();
  const [wishlist, wishlistDispatch] = useWishlist();
  const [currency] = useCurrency();
  const effectivePrice = getEffectivePrice(product, currency);

  const [size, setSize] = React.useState<string>(product.sizes[0] ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [deliveryWindow, setDeliveryWindow] = React.useState<string | null>(null);
  const isWishlisted = wishlist.includes(product.id);
  const sizeCount = product.sizes.length;
  const showSizeSelect = sizeCount > 1;
  const colorOptions = React.useMemo(
    () => (product.taxonomy.color ? Array.from(new Set(product.taxonomy.color)) : []),
    [product.taxonomy.color],
  );
  const colorMedia = product.media.filter(isProductImage);
  const variantProducts = React.useMemo(() => {
    if (!product.variantGroup) return [];
    const items = products.filter((item) => item.variantGroup === product.variantGroup);
    return items.sort((a, b) => (a.id === product.id ? -1 : b.id === product.id ? 1 : 0));
  }, [product.id, product.variantGroup, products]);
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

  React.useEffect(() => {
    setDeliveryWindow(getDeliveryWindow());
  }, []);

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
          price={effectivePrice}
          currency={currency}
          className="xa-pdp-price"
        />
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
        </div>
      ) : null}
      {sizeNote ? <div className="xa-pdp-meta text-muted-foreground">{sizeNote}</div> : null}

      <div className="xa-pdp-meta text-muted-foreground">
        {xaI18n.t("xaB.src.components.xabuybox.client.quantityFixed")}
      </div>

      {error ? (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">
          {error}
        </div>
      ) : null}

      <Inline gap={2} className="flex-wrap">
        <Button
          className="xa-pdp-action xa-flex-2 h-11 rounded-none bg-foreground text-primary-foreground hover:bg-foreground/90"
          disabled={soldOut}
          onClick={() => void addToCart()}
        >
          Add To Bag
        </Button>
        <Button
          variant="outline"
          className="xa-pdp-action h-11 w-11 min-w-11 rounded-none border-foreground text-foreground hover:bg-foreground hover:text-primary-foreground"
          aria-pressed={isWishlisted}
          aria-label={isWishlisted ? xaI18n.t("xaB.src.components.xabuybox.client.l176c38") : xaI18n.t("xaB.src.components.xabuybox.client.l176c63")}
          onClick={() => wishlistDispatch({ type: "toggle", sku: product })}
        >
          {isWishlisted ? (
            <HeartFilledIcon className="h-4 w-4" />
          ) : (
            <HeartIcon className="h-4 w-4" />
          )}
        </Button>
      </Inline>

      {soldOut ? (
        <div className="xa-pdp-meta text-muted-foreground">{xaI18n.t("xaB.src.components.xabuybox.client.l188c60")}</div>
      ) : null}

      <div className="space-y-2">
        <div className="xa-pdp-label text-muted-foreground">{xaI18n.t("xaB.src.components.xabuybox.client.l192c61")}</div>
        <div className="xa-pdp-meta">
          {deliveryWindow ?? "Calculating delivery estimate"} {/* i18n-exempt -- XA-0091 [ttl=2026-12-31] hydration-safe transitional copy */}
        </div>
      </div>

      {showVariantStrip || showColorStrip ? (
        <div className="space-y-2">
          <div className="xa-pdp-label text-muted-foreground">{xaI18n.t("xaB.src.components.xabuybox.client.l200c63")}</div>
          {showVariantStrip ? (
            <XaColorSwatchStrip
              items={variantProducts.map((variant) => {
                const color = variant.taxonomy.color?.[0] ?? "";
                const label = color ? formatLabel(color) : variant.title;
                const media = variant.media.find(isProductImage);
                return {
                  key: `${variant.slug}-variant`,
                  label,
                  swatch: color ? (XA_COLOR_SWATCHES[color] ?? XA_DEFAULT_SWATCH) : XA_DEFAULT_SWATCH,
                  imageUrl: media?.url,
                  imageAlt: label,
                  isCurrent: variant.id === product.id,
                  href: getProductHref(variant.slug),
                };
              })}
            />
          ) : (
            <XaColorSwatchStrip
              items={colorOptions.map((color, idx) => {
                const media = colorMedia[idx % Math.max(1, colorMedia.length)];
                return {
                  key: `${product.slug}-color-${color}`,
                  label: formatLabel(color),
                  swatch: XA_COLOR_SWATCHES[color] ?? XA_DEFAULT_SWATCH,
                  imageUrl: media?.url,
                  imageAlt: formatLabel(color),
                };
              })}
            />
          )}
        </div>
      ) : null}

      {/* i18n-exempt: XA-0001 */}
      <div className="xa-pdp-meta rounded-none bg-muted/60 px-4 py-3 text-foreground">{xaI18n.t("xaB.src.components.xabuybox.client.l276c87")}</div>
    </div>
  );
}
