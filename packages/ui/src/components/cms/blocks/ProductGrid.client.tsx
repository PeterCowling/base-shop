"use client";

import { ProductGrid as BaseGrid } from "@platform-core/src/components/shop/ProductGrid";
import type { SKU } from "@types";

export interface ProductGridProps {
  skus: SKU[];
  columns?: number;
  minCols?: number;
  maxCols?: number;
  className?: string;
}

export default function ProductGrid({
  skus,
  columns,
  minCols,
  maxCols,
  className,
}: ProductGridProps) {
  return (
    <BaseGrid
      skus={skus}
      columns={columns}
      minCols={minCols}
      maxCols={maxCols}
      className={className}
    />
  );
}
