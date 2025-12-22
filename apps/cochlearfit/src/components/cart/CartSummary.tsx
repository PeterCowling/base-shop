"use client";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "@acme/i18n";
import { useCart } from "@/contexts/cart/CartContext";
import { useLocale } from "@/contexts/LocaleContext";
import { withLocale } from "@/lib/routes";
import Price from "@/components/Price";

const CartSummary = React.memo(function CartSummary() {
  const t = useTranslations();
  const locale = useLocale();
  const { subtotal, itemCount, currency } = useCart();

  const checkoutHref = useMemo(() => withLocale("/checkout", locale), [locale]);
  const handleCheckoutClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (itemCount === 0) {
        event.preventDefault();
      }
    },
    [itemCount]
  );
  const disabledClasses = [
    "mt-4",
    "inline-flex",
    "min-h-12",
    "w-full",
    "items-center",
    "justify-center",
    "rounded-full",
    "bg-muted/20",
    "text-sm",
    "font-semibold",
    "text-muted-foreground",
  ];
  const activeClasses = [
    "mt-4",
    "inline-flex",
    "min-h-12",
    "w-full",
    "items-center",
    "justify-center",
    "rounded-full",
    "bg-primary",
    "text-sm",
    "font-semibold",
    "text-primary-foreground",
    "transition",
    "hover:bg-accent",
    "focus-visible:focus-ring",
  ];

  return (
    <div className="surface rounded-3xl border border-border-1 p-5">
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("cart.summary") as string}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("cart.items") as string}</span>
          <span className="text-sm font-semibold">{itemCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("cart.subtotal") as string}</span>
          <span className="text-base font-semibold">
            <Price amount={subtotal} currency={currency} />
          </span>
        </div>
      </div>
      <Link
        href={checkoutHref}
        onClick={handleCheckoutClick}
        tabIndex={itemCount === 0 ? -1 : 0}
        className={(itemCount === 0 ? disabledClasses : activeClasses).join(" ")}
        aria-disabled={itemCount === 0}
      >
        {t("cart.checkout") as string}
      </Link>
    </div>
  );
});

export default CartSummary;
