"use client";

import { ProductGrid as BaseGrid } from "@acme/platform-core/components/shop/ProductGrid";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";
import { useEffect, useState } from "react";
import { fetchCollection } from "./products/fetchCollection";

export interface ProductGridProps {
  skus?: SKU[];
  collectionId?: string;
  columns?: number;
  minItems?: number;
  maxItems?: number;
  desktopItems?: number;
  tabletItems?: number;
  mobileItems?: number;
  className?: string;
}

export default function ProductGrid({
  skus,
  collectionId,
  columns,
  minItems,
  maxItems,
  desktopItems,
  tabletItems,
  mobileItems,
  className,
}: ProductGridProps) {
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

  return (
    <BaseGrid
      skus={items}
      columns={columns}
      minItems={minItems}
      maxItems={maxItems}
      desktopItems={desktopItems}
      tabletItems={tabletItems}
      mobileItems={mobileItems}
      className={className}
    />
  );
}

export function getRuntimeProps() {
  return { skus: PRODUCTS as SKU[] };
}
