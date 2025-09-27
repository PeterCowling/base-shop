// packages/platform-core/components/shop/AddToCartButton.tsx
"use client";

import { useCart } from "../../contexts/CartContext";
import type { SKU } from "@acme/types";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

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
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceDisabled, setForceDisabled] = useState(false);

  // Keep the actual DOM disabled state in sync to satisfy testing-library's
  // toBeDisabled matcher under JSDOM consistently when timers are mocked.
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const off = !!disabled;
    const isDisabled = forceDisabled || adding || off;
    el.disabled = isDisabled;
    try {
      if (isDisabled) el.setAttribute("disabled", "");
      else el.removeAttribute("disabled");
    } catch {
      // ignore
    }
  }, [adding, forceDisabled, disabled]);

  async function handleClick(_e: React.MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (quantity < 1) {
      setError("Quantity must be at least 1"); // i18n-exempt -- ABC-123 validation message
      return;
    }
    // Snapshot the target to survive React event pooling
    // Synchronously mark disabled before any async work to avoid flake
    flushSync(() => {
      setForceDisabled(true);
    });
    flushSync(() => {
      setAdding(true);
      setError(null);
    });

    try {
      await dispatch({ type: "add", sku, size, qty: quantity });
    } catch (err) {
      setError((err as Error).message ?? "Unable to add to cart"); // i18n-exempt -- ABC-123 fallback error message
    } finally {
      flushSync(() => {
        setAdding(false);
      });
      flushSync(() => {
        setAdding(false);
        setForceDisabled(false);
      });
    }
  }

  return (
    <>
      <fieldset
        disabled={forceDisabled || adding || disabled}
        className="border-0 m-0 p-0"
      >
        <button
          ref={btnRef}
          onClick={handleClick}
          disabled={forceDisabled || adding || disabled}
          aria-disabled={forceDisabled || adding || disabled ? true : undefined}
          aria-label="Add to cart"
          className="mt-auto rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 min-h-10 min-w-10"
        >
          {adding ? (
            <span className="inline-flex items-center gap-2" aria-live="polite">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              {"Adding..."} {/* i18n-exempt -- ABC-123 loading state text */}
            </span>
          ) : (
            // i18n-exempt -- ABC-123 button copy pending translation integration
            "Add to cart"
          )}
        </button>
      </fieldset>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
