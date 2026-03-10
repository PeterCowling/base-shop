"use client";

import Link from "next/link";

import { useCart } from "@acme/platform-core/contexts/CartContext";

export function CartIcon({ lang }: { lang: string }) {
  const [cart] = useCart();
  const count = Object.values(cart).reduce((n, line) => n + line.qty, 0);

  return (
    <Link
      href={`/${lang}/cart`}
      className="relative inline-flex items-center opacity-70 transition-opacity hover:opacity-100"
      aria-label={count > 0 ? `Cart (${count} item${count === 1 ? "" : "s"})` : "Cart"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 002 1.58h9.78a2 2 0 001.95-1.57l1.65-7.43H5.12" />
      </svg>
      {count > 0 && (
        <span
          className="absolute -top-1.5 -end-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background"
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
