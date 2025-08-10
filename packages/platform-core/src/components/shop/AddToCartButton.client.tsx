// packages/platform-core/components/shop/AddToCartButton.tsx
"use client";

import { useCart } from "@platform-core/src/contexts/CartContext";
import type { SKU } from "@types";
import { useState } from "react";

type Props = {
  sku: SKU;
  /** Optional selected size */
  size?: string;
  /** Disable button until prerequisites are met (e.g. size chosen) */
  disabled?: boolean;
};

export default function AddToCartButton({
  sku,
  size,
  disabled = false,
}: Props) {
  const [, dispatch] = useCart();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (disabled) return;
    setAdding(true);
    setError(null);

    try {
      const result = await dispatch({ type: "add", sku, size });
      if (!result.ok) {
        setError(result.error ?? "Unable to add to cart");
      }
      /* fake latency for UX feedback */
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      setError("Unable to add to cart");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={adding || disabled}
        className="mt-auto rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {adding ? "✓" : "Add to cart"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
