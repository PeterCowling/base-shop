"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { useTranslations } from "@acme/i18n";
import AddToCartButton from "@acme/platform-core/components/shop/AddToCartButton.client";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";

import { Price } from "../../atoms/Price";
import { ProductVariantSelector } from "../../organisms/ProductVariantSelector";

import { fetchCollection } from "./products/fetchCollection";

type FeaturedProduct = SKU & {
  badges?: { sale?: boolean; new?: boolean };
};

export interface FeaturedProductBlockProps {
  sku?: FeaturedProduct;
  collectionId?: string;
}

export function getRuntimeProps() {
  return { sku: PRODUCTS[0] as SKU };
}

export default function FeaturedProductBlock({
  sku,
  collectionId,
}: FeaturedProductBlockProps) {
  const t = useTranslations();
  // i18n-exempt -- DS-1234 [ttl=2025-11-30]: technical constants, not user-facing
  const responsiveSizes = "(min-width: 768px) 50vw, 100vw"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  const secondaryMediaDataCy = "secondary-media"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  const ASPECT_SQUARE = "1/1"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  const [product, setProduct] = useState<FeaturedProduct | null>(sku ?? null);
  const [size, setSize] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (collectionId) {
        const fetched = await fetchCollection(collectionId);
        if (!cancelled) setProduct((fetched[0] as FeaturedProduct) ?? null);
      } else {
        setProduct(sku ?? null);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [collectionId, sku]);

  if (!product) return null;

  const media = product.media?.[0];
  const secondaryMedia = product.media?.[1];

  return (
    <div className="flex flex-col gap-4">
      {media?.url && (
        <div className="relative aspect-square w-full">
          {media.type === "image" ? (
            <Image
              src={media.url}
              alt={media.altText ?? product.title ?? ""}
              fill
              sizes={responsiveSizes}
              className="rounded-md object-cover"
            />
          ) : (
            <video
              src={media.url}
              className="h-full w-full rounded-md object-cover"
              data-aspect={ASPECT_SQUARE}
              muted
              playsInline
            />
          )}
        </div>
      )}
      {secondaryMedia?.url && (
        <div className="relative aspect-square w-full" data-cy={secondaryMediaDataCy}>
          {secondaryMedia.type === "image" ? (
            <Image
              src={secondaryMedia.url}
              alt={secondaryMedia.altText ?? product.title ?? ""}
              fill
              sizes={responsiveSizes}
              className="rounded-md object-cover"
            />
          ) : (
            <video
              src={secondaryMedia.url}
              className="h-full w-full rounded-md object-cover"
              data-aspect={ASPECT_SQUARE}
              muted
              playsInline
            />
          )}
        </div>
      )}
      {product.badges?.sale && <span data-cy="badge-sale">{t("product.badge.sale")}</span>}
      {product.badges?.new && <span data-cy="badge-new">{t("product.badge.new")}</span>}
      <h3 className="text-xl font-semibold">{product.title}</h3>
      <Price amount={product.price ?? 0} className="text-lg font-medium" />
      <ProductVariantSelector
        sizes={product.sizes}
        selectedSize={size}
        onSizeChange={setSize}
        quantity={quantity}
        onQuantityChange={setQuantity}
      />
      <AddToCartButton
        sku={product}
        size={size}
        quantity={quantity}
        disabled={product.sizes?.length > 0 && !size}
      />
    </div>
  );
}
