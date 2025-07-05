"use client";

import { ProductGrid as BaseGrid } from "@platform-core/src/components/shop/ProductGrid";
import { PRODUCTS } from "@platform-core/src/products";
import type { SKU } from "@types";

export default function ProductGrid() {
  return <BaseGrid skus={PRODUCTS as SKU[]} />;
}
