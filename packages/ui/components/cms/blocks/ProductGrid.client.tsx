"use client";

import { ProductGrid as BaseGrid } from "@/components/shop/ProductGrid";
import { PRODUCTS } from "@/lib/products";
import type { SKU } from "@types";

export default function ProductGrid() {
  return <BaseGrid skus={PRODUCTS as SKU[]} />;
}
