// packages/platform-core/components/shop/AddToCartButton.tsx
"use client";

import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import type { SKU } from "../../products";

type Props = {
  sku: SKU;
  /** Disable button until prerequisites are met (e.g. size chosen) */
  disabled?: boolean;
};

export default function AddToCartButton({ sku, disabled = false }: Props) {
  const [, dispatch] = useCart();
  const [adding, setAdding] = useState(false);

  async function handleClick() {
    if (disabled) return;
    setAdding(true);
    dispatch({ type: "add", sku });
    /* fake latency for UX feedback */
    await new Promise((r) => setTimeout(r, 300));
    setAdding(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={adding || disabled}
      className="mt-auto bg-gray-900 text-white rounded py-2 px-4 text-sm hover:bg-gray-800 disabled:opacity-50"
    >
      {adding ? "✓" : "Add to cart"}
    </button>
  );
}
