"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "@acme/i18n";
import { useLocale } from "@/contexts/LocaleContext";
import { withLocale } from "@/lib/routes";
import { useCart } from "@/contexts/cart/CartContext";

const CartIconButton = React.memo(function CartIconButton() {
  const t = useTranslations();
  const locale = useLocale();
  const { itemCount } = useCart();

  const label = useMemo(() => t("nav.cart") as string, [t]);
  const countVars = useMemo(() => ({ count: itemCount }), [itemCount]);
  const countLabel = useMemo(
    () =>
      itemCount > 0
        ? (t("cart.itemCount", countVars) as string)
        : (t("cart.empty") as string),
    [countVars, itemCount, t]
  );

  return (
    <Link
      href={withLocale("/cart", locale)}
      aria-label={label}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-1 bg-surface-2 text-foreground shadow-soft transition hover:border-primary/40 focus-visible:focus-ring"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="20" r="1.8" />
        <circle cx="18" cy="20" r="1.8" />
        <path d="M2 4h2l2.6 10.2a2 2 0 0 0 2 1.5h8.6a2 2 0 0 0 1.9-1.3l2.4-6.4H7.1" />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">
          {itemCount}
        </span>
      )}
      <span className="sr-only">{countLabel}</span>
    </Link>
  );
});

export default CartIconButton;
