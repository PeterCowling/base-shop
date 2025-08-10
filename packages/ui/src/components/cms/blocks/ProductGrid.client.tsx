"use client";

import { ProductGrid as BaseGrid } from "@platform-core/src/components/shop/ProductGrid";
import type { SKU } from "@types";

export interface ProductGridProps {
  skus: SKU[];
  columns?: number;
  minItems?: number;
  maxItems?: number;
  className?: string;
}

export default function ProductGrid({
  skus,
  columns,
  minItems,
  maxItems,
  className,
}: ProductGridProps) {
  return (
    <BaseGrid
      skus={skus}
      columns={columns}
      minItems={minItems}
      maxItems={maxItems}
      className={className}
    />
  );
}
