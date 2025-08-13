"use client";

import { useState } from "react";
import type { SKU } from "@acme/types";
import { getProductById } from "@platform-core/src/products";
import { useCart } from "@platform-core/src/contexts/CartContext";
import { Price } from "../../atoms/Price";

interface BundleItem {
  sku: string;
  quantity?: number;
}

export interface ProductBundleProps {
  items?: BundleItem[];
  /** Discount percentage to apply to total price */
  discountPercent?: number;
}

export default function ProductBundle({
  items = [],
  discountPercent = 0,
}: ProductBundleProps) {
  const [, dispatch] = useCart();
  const [adding, setAdding] = useState(false);

  const products = items
    .map((item) => {
      const sku = getProductById(item.sku);
      if (!sku) return null;
      const qty = item.quantity ? Number(item.quantity) : 1;
      return { sku, quantity: isNaN(qty) ? 1 : qty };
    })
    .filter(Boolean) as { sku: SKU; quantity: number }[];

  if (!products.length) return null;

  const subtotal = products.reduce(
    (sum, { sku, quantity }) => sum + sku.price * quantity,
    0,
  );
  const total = subtotal * (1 - discountPercent / 100);

  async function handleAdd() {
    setAdding(true);
    try {
      for (const { sku, quantity } of products) {
        await dispatch({ type: "add", sku, qty: quantity });
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-1">
        {products.map(({ sku, quantity }) => (
          <li key={sku.id} className="flex justify-between">
            <span>
              {sku.title} x{quantity}
            </span>
            <Price amount={sku.price * quantity} />
          </li>
        ))}
      </ul>
      <div className="flex items-baseline gap-2 font-semibold">
        {discountPercent > 0 && (
          <Price
            amount={subtotal}
            className="text-muted-foreground line-through"
          />
        )}
        <Price amount={total} />
      </div>
      <button
        onClick={handleAdd}
        disabled={adding}
        className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {adding ? "Adding..." : "Add Bundle to Cart"}
      </button>
    </div>
  );
}

export function getRuntimeProps() {
  return {
    items: [
      { sku: "green-sneaker", quantity: 1 },
      { sku: "sand-sneaker", quantity: 1 },
    ],
    discountPercent: 10,
  } satisfies ProductBundleProps;
}

