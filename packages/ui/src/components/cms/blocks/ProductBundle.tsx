import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";

import { Price } from "../../atoms/Price";

export interface ProductBundleProps {
  skus?: SKU[];
  /** Percentage discount applied to the combined price */
  discount?: number;
  /** Quantity of bundles */
  quantity?: number;
}

/**
 * Display a list of products with a combined bundle price.
 */
export default function ProductBundle({
  skus = [],
  discount = 0,
  quantity = 1,
}: ProductBundleProps) {
  if (!skus.length) return null;

  const subtotal =
    skus.reduce((sum, sku) => sum + (sku.price ?? 0), 0) * quantity;
  const finalPrice = discount ? subtotal * (1 - discount / 100) : subtotal;

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {skus.map((sku) => (
          <li key={sku.id} className="flex items-center justify-between">
            <span>{sku.title}</span>
            <Price amount={sku.price ?? 0} />
          </li>
        ))}
      </ul>
      {discount ? (
        <div className="flex items-baseline gap-2">
          <Price
            amount={subtotal}
            className="line-through text-muted-foreground"
          />
          <Price amount={finalPrice} className="font-semibold" />
        </div>
      ) : (
        <Price amount={finalPrice} className="font-semibold" />
      )}
    </div>
  );
}

export function getRuntimeProps() {
  return { skus: PRODUCTS.slice(0, 2) as SKU[] };
}

