"use client";

import { useEffect, useRef, useState } from "react";

import AddToCartButton from "@acme/platform-core/components/shop/AddToCartButton.client";
import type { SKU } from "@acme/types";

interface StickyCheckoutBarProps {
  priceLabel: string;
  sku: SKU;
  trustLine?: string;
}

export function StickyCheckoutBar({ priceLabel, sku, trustLine }: StickyCheckoutBarProps) {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="pointer-events-none h-0" aria-hidden="true" data-cy="checkout-sentinel" />
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur-sm transition-transform duration-200 md:hidden ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!visible}
      >
        <div className="mx-auto max-w-lg space-y-1">
          <div className="flex items-center justify-between gap-4">
            <p className="text-base font-medium">{priceLabel}</p>
            <AddToCartButton sku={sku} disabled={sku.stock === 0} />
          </div>
          {trustLine && (
            <p className="text-xs text-muted-foreground">{trustLine}</p>
          )}
        </div>
      </div>
    </>
  );
}
