"use client";

import { ProductGrid as BaseGrid } from "@platform-core/src/components/shop/ProductGrid";
import type { SKU } from "@types";

export interface ProductGridProps {
  skus: SKU[];
}

export default function ProductGrid({ skus }: ProductGridProps) {
  return <BaseGrid skus={skus} />;
}
