"use client";

import { useEffect, useState } from "react";
import type { SKU } from "@acme/types";
import AddToCartButton from "@platform-core/src/components/shop/AddToCartButton.client";
import { PRODUCTS } from "@platform-core/src/products";
import { Price } from "../../atoms/Price";
import { ProductVariantSelector } from "../../organisms/ProductVariantSelector";
import { fetchCollection } from "./products/fetchCollection";

interface Props {
  sku?: SKU;
  collectionId?: string;
  className?: string;
}

export default function FeaturedProductBlock({ sku, collectionId, className }: Props) {
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

  const requiresSize = Array.isArray(product.sizes) && product.sizes.length > 0;

  return (
    <div className={className}>
      {product.media?.[0] && (
        <img
          src={product.media[0].url}
          alt={product.title}
          className="mb-4 w-full rounded object-cover"
        />
      )}
      <h3 className="font-medium">{product.title}</h3>
      <Price amount={product.price} className="mb-4 font-semibold" />
      <ProductVariantSelector
        sizes={product.sizes}
        selectedSize={size}
        onSizeChange={setSize}
        quantity={quantity}
        onQuantityChange={setQuantity}
        className="mb-4"
      />
      <AddToCartButton
        sku={product}
        size={size}
        quantity={quantity}
        disabled={requiresSize && !size}
      />
    </div>
  );
}

export function getRuntimeProps() {
  return { sku: PRODUCTS[0] };
}
