"use client";

import React, { useCallback, useMemo, useState } from "react";

import { useTranslations } from "@acme/i18n";

import CheckoutButton from "@/components/checkout/CheckoutButton";
import Price from "@/components/Price";
import { useCart } from "@/contexts/cart/CartContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getCartLineItems } from "@/lib/cart";
import { createCheckoutSession } from "@/lib/checkout";
import type { Product } from "@/types/product";

const CheckoutPanel = React.memo(function CheckoutPanel({ products }: { products: Product[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const { items, subtotal, currency } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lineItems = useMemo(
    () => getCartLineItems(items, products),
    [items, products]
  );
  const canCheckout = items.length > 0;

  const payload = useMemo(
    () => ({
      items: items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      locale,
    }),
    [items, locale]
  );

  const handleCheckout = useCallback(async () => {
    if (!canCheckout) return;
    setError(null);
    setIsLoading(true);
    try {
      const session = await createCheckoutSession(payload);
      window.location.href = session.url;
    } catch {
      setError(t("checkout.error") as string);
      setIsLoading(false);
    }
  }, [canCheckout, payload, t]);

  return (
    <div className="space-y-6">
      <div className="surface rounded-3xl border border-border-1 p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("checkout.review") as string}
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {lineItems.map((entry) => (
            <div key={entry.item.variantId} className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{t(entry.product.name) as string}</div>
                <div className="text-muted-foreground">
                  {t(`size.${entry.variant.size}`) as string} / {t(`color.${entry.variant.color}`) as string}
                </div>
              </div>
              <div className="text-end">
                <div className="text-xs text-muted-foreground">{t("checkout.qty") as string} {entry.item.quantity}</div>
                <div className="font-semibold">
                  <Price amount={entry.variant.price * entry.item.quantity} currency={entry.variant.currency} />
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border-1 pt-3 text-base font-semibold">
            <span>{t("checkout.total") as string}</span>
            <Price amount={subtotal} currency={currency} />
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <CheckoutButton
        onClick={handleCheckout}
        disabled={!canCheckout}
        isLoading={isLoading}
        label={t("checkout.pay") as string}
        loadingLabel={t("checkout.loading") as string}
      />
    </div>
  );
});

export default CheckoutPanel;
