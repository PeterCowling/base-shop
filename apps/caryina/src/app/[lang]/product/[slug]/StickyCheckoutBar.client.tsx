"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface StickyCheckoutBarProps {
  priceLabel: string;
  checkoutHref: string;
  outOfStock?: boolean;
}

export function StickyCheckoutBar({
  priceLabel,
  checkoutHref,
  outOfStock = false,
}: StickyCheckoutBarProps) {
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
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <p className="text-base font-medium">{priceLabel}</p>
          {outOfStock ? (
            <button
              type="button"
              className="btn-primary min-h-[44px] cursor-not-allowed rounded-full px-5 py-2.5 text-sm opacity-50"
              disabled
              aria-disabled="true"
            >
              Out of stock
            </button>
          ) : (
            <Link
              href={checkoutHref}
              className="btn-primary rounded-full px-5 py-2.5 text-sm"
            >
              Checkout
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
