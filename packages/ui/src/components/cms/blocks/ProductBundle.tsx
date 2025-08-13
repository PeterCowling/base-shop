import Image from "next/image";
import type { SKU } from "@acme/types";
import { Price } from "../../atoms/Price";

export interface ProductBundleProps {
  /** List of products included in the bundle */
  skus?: SKU[];
  /** Percentage discount applied to the bundle total */
  discountPercent?: number;
  /** Quantity of each item in the bundle */
  quantity?: number;
}

export function getRuntimeProps() {
  const { PRODUCTS } = require("@platform-core/src/products");
  return {
    skus: PRODUCTS.slice(0, 2),
    discountPercent: 10,
    quantity: 1,
  } as ProductBundleProps;
}

/**
 * Display multiple products with bundle pricing and discount information.
 */
export default function ProductBundle({
  skus = [],
  discountPercent = 0,
  quantity = 1,
}: ProductBundleProps) {
  if (!skus.length) return null;

  const subtotal = skus.reduce(
    (sum, sku) => sum + sku.price * quantity,
    0
  );
  const finalPrice = subtotal * (1 - discountPercent / 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {skus.map((sku) => (
          <div key={sku.id} className="flex items-center gap-4">
            {sku.media?.[0]?.type === "image" && (
              <div className="relative h-16 w-16 flex-shrink-0">
                <Image
                  src={sku.media[0].url}
                  alt={sku.title}
                  fill
                  className="rounded object-cover"
                />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium">{sku.title}</span>
              <div className="text-sm text-muted-foreground">
                <Price amount={sku.price} />
                {quantity > 1 && <span className="ml-1">×{quantity}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t pt-2">
        <div className="text-right">
          {discountPercent > 0 && (
            <Price amount={subtotal} className="mr-2 line-through text-sm" />
          )}
          <Price amount={finalPrice} className="font-semibold" />
        </div>
      </div>
    </div>
  );
}
