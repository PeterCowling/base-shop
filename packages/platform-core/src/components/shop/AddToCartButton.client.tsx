// packages/platform-core/components/shop/AddToCartButton.tsx
"use client";

import { useCart } from "../../contexts/CartContext";
import type { SKU } from "@acme/types";
import { useState } from "react";

type Props = {
  sku: SKU;
  /** Optional selected size */
  size?: string;
  /** Disable button until prerequisites are met (e.g. size chosen) */
  disabled?: boolean;
  /** Number of items to add */
  quantity?: number;
};

export default function AddToCartButton({
  sku,
  size,
  disabled = false,
  quantity = 1,
}: Props) {
  const [, dispatch] = useCart();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (disabled) return;
    if (quantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }
    setAdding(true);
    setError(null);

    try {
      await dispatch({ type: "add", sku, size, qty: quantity });
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
        className="mt-auto rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {adding ? (
          <span className="flex items-center gap-2" aria-live="polite">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Adding...
          </span>
        ) : (
          "Add to cart"
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
