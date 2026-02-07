import * as React from "react";

import type { SKU } from "@acme/types";

import { cn } from "../../utils/style";
import { ProductCard } from "../organisms/ProductCard";

export interface ProductComparisonTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  products: SKU[];
}

/**
 * Display multiple products side by side for comparison.
 */
export function ProductComparisonTemplate({
  products,
  className,
  ...props
}: ProductComparisonTemplateProps) {
  return (
    <div
      className={cn(
        "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        className,
      )}
      {...props}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
