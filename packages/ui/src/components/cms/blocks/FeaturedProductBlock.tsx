"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { SKU } from "@acme/types";
import AddToCartButton from "@acme/platform-core/components/shop/AddToCartButton.client";
import { PRODUCTS } from "@acme/platform-core/products";
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

  return (
    <div className="flex flex-col gap-4">
      {product.media[0] && (
        <div className="relative aspect-square w-full">
          {product.media[0].type === "image" ? (
            <Image
              src={product.media[0].url}
              alt={product.title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="rounded-md object-cover"
            />
          ) : (
            <video
              src={product.media[0].url}
              className="h-full w-full rounded-md object-cover"
              muted
              playsInline
            />
          )}
        </div>
      )}
      <h3 className="text-xl font-semibold">{product.title}</h3>
      <Price amount={product.price} className="text-lg font-medium" />
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

