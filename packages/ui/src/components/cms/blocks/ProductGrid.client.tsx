"use client";

import { ProductGrid as BaseGrid } from "@platform-core/src/components/shop/ProductGrid";
import type { SKU } from "@types";

export interface ProductGridProps {
  skus: SKU[];
  minCols?: number;
  maxCols?: number;
}

export default function ProductGrid({
  skus,
  minCols,
  maxCols,
}: ProductGridProps) {
  return <BaseGrid skus={skus} minCols={minCols} maxCols={maxCols} />;
}
