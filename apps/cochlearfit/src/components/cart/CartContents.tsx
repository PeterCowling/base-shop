"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "@acme/i18n";
import type { Product } from "@/types/product";
import { useCart } from "@/contexts/cart/CartContext";
import { getCartLineItems } from "@/lib/cart";
import CartItemRow from "@/components/cart/CartItemRow";
import CartSummary from "@/components/cart/CartSummary";
import { useLocale } from "@/contexts/LocaleContext";
import { withLocale } from "@/lib/routes";

const CartContents = React.memo(function CartContents({ products }: { products: Product[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const { items } = useCart();
  const lineItems = useMemo(
    () => getCartLineItems(items, products),
    [items, products]
  );
  const shopHref = useMemo(() => withLocale("/shop", locale), [locale]);

  if (items.length === 0) {
    return (
      <div className="surface animate-fade-up rounded-3xl border border-border-1 p-6 text-center">
        <h2 className="font-display text-2xl font-semibold">
          {t("cart.emptyTitle") as string}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("cart.emptyBody") as string}</p>
        <Link
          href={shopHref}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-accent focus-visible:focus-ring"
        >
          {t("cart.emptyCta") as string}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {lineItems.map((entry) => (
          <CartItemRow
            key={entry.item.variantId}
            item={entry.item}
            product={entry.product}
            variant={entry.variant}
          />
        ))}
      </div>
      <CartSummary />
    </div>
  );
});

export default CartContents;
