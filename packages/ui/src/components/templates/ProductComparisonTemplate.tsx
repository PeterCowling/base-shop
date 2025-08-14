import * as React from "react";
import { cn } from "../../utils/style";
import type { SKU } from "@acme/types";
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
      className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
