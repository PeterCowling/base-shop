import { useEffect, useState } from "react";
import type { SKU } from "@acme/types";
import { PRODUCTS } from "@platform-core/src/products";
import { fetchCollection } from "./products/fetchCollection";
import { Price } from "../../atoms/Price";

interface ProductBundleProps {
  skus?: SKU[];
  quantities?: number[];
  discount?: number;
  collectionId?: string;
}

export function getRuntimeProps() {
  return {
    skus: PRODUCTS.slice(0, 2) as SKU[],
    quantities: [1, 1],
    discount: 10,
  };
}

export default function ProductBundle({
  skus,
  quantities = [],
  discount = 0,
  collectionId,
}: ProductBundleProps) {
  const [items, setItems] = useState<SKU[]>(skus ?? []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (collectionId) {
        const fetched = await fetchCollection(collectionId);
        if (!cancelled) setItems(fetched);
      } else {
        setItems(skus ?? []);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [collectionId, skus]);

  if (!items.length) return null;

  const total = items.reduce(
    (sum, sku, idx) => sum + sku.price * (quantities[idx] ?? 1),
    0,
  );
  const bundlePrice = Math.round(total * (1 - discount / 100));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((sku, idx) => (
          <div key={sku.id} className="flex gap-4">
            {sku.image && (
              <img
                src={sku.image}
                alt={sku.title}
                className="h-24 w-24 rounded object-cover"
              />
            )}
            <div className="flex flex-col justify-center">
              <span className="font-semibold">{sku.title}</span>
              <Price amount={sku.price} className="text-sm" />
              <span className="text-xs text-muted">x {quantities[idx] ?? 1}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t pt-2">
        <span className="font-medium">Bundle price</span>
        <Price amount={bundlePrice} className="text-lg font-semibold" />
      </div>
    </div>
  );
}
