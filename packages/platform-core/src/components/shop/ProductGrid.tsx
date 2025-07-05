// src/components/shop/ProductGrid.tsx
import type { SKU } from "@types";
import { memo, useMemo } from "react";
import { ProductCard } from "./ProductCard";

type Props = { skus: SKU[] };

function ProductGridInner({ skus }: Props) {
  // simple alphabetic sort for deterministic order (SSR/CSR match)
  const sorted = useMemo(
    () => [...skus].sort((a, b) => a.title.localeCompare(b.title)),
    [skus]
  );

  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((sku) => (
        <ProductCard key={sku.id} sku={sku} />
      ))}
    </section>
  );
}

export const ProductGrid = memo(ProductGridInner);
