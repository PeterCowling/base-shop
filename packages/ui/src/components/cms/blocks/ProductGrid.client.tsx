"use client";

import { ProductGrid as BaseGrid } from "@platform-core/src/components/shop/ProductGrid";
import type { SKU } from "@acme/types";

export interface ProductGridProps {
  skus: SKU[];
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
  columns,
  minItems,
  maxItems,
  desktopItems,
  tabletItems,
  mobileItems,
  className,
}: ProductGridProps) {
  return (
    <BaseGrid
      skus={skus}
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
