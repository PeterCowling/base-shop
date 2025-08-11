// packages/platform-core/components/shop/AddToCartButton.tsx
"use client";

import { useCart } from "@platform-core/src/contexts/CartContext";
import type { SKU } from "@types";
import { useState } from "react";
import { Loader } from "@ui";

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
      await dispatch({ type: "add", sku, size });
    } catch (err) {
      setError((err as Error).message ?? "Unable to add to cart");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={adding || disabled}
        className="mt-auto flex items-center justify-center rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {adding ? <Loader className="text-white" size={16} /> : "Add to cart"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
