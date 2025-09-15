"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { SKU } from "@acme/types";
import AddToCartButton from "@acme/platform-core/components/shop/AddToCartButton.client";
import { PRODUCTS } from "@acme/platform-core/products/index";
import { fetchCollection } from "./products/fetchCollection";
import { Price } from "../../atoms/Price";
import { ProductVariantSelector } from "../../organisms/ProductVariantSelector";

export interface FeaturedProductBlockProps {
  sku?: SKU;
  collectionId?: string;
}

export function getRuntimeProps() {
  return { sku: PRODUCTS[0] as SKU };
}

export default function FeaturedProductBlock({
  sku,
  collectionId,
}: FeaturedProductBlockProps) {
  const [product, setProduct] = useState<SKU | null>(sku ?? null);
  const [size, setSize] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (collectionId) {
        const fetched = await fetchCollection(collectionId);
        if (!cancelled) setProduct(fetched[0] ?? null);
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
              sizes="(min-width: 768px) 50vw, 100vw"
              className="rounded-md object-cover"
            />
          ) : (
            <video
              src={media.url}
              className="h-full w-full rounded-md object-cover"
              muted
              playsInline
            />
          )}
        </div>
      )}
      {secondaryMedia?.url && (
        <div className="relative aspect-square w-full" data-cy="secondary-media">
          {secondaryMedia.type === "image" ? (
            <Image
              src={secondaryMedia.url}
              alt={secondaryMedia.altText ?? product.title ?? ""}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="rounded-md object-cover"
            />
          ) : (
            <video
              src={secondaryMedia.url}
              className="h-full w-full rounded-md object-cover"
              muted
              playsInline
            />
          )}
        </div>
      )}
      {product.badges?.sale && <span data-cy="badge-sale">Sale</span>}
      {product.badges?.new && <span data-cy="badge-new">New</span>}
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

