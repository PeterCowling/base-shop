"use client";

import React, { useCallback, useMemo } from "react";
import { useTranslations } from "@acme/i18n";
import type { CartItem } from "@/types/cart";
import type { Product, ProductVariant } from "@/types/product";
import { useCart } from "@/contexts/cart/CartContext";
import QuantityStepper from "@/components/QuantityStepper";
import Price from "@/components/Price";
import Button from "@/components/Button";

type CartItemRowProps = {
  item: CartItem;
  product: Product;
  variant: ProductVariant;
};

const CartItemRow = React.memo(function CartItemRow({
  item,
  product,
  variant,
}: CartItemRowProps) {
  const t = useTranslations();
  const { setQuantity, removeItem } = useCart();

  const handleQuantityChange = useCallback(
    (next: number) => {
      setQuantity(item.variantId, next);
    },
    [item.variantId, setQuantity]
  );

  const handleRemove = useCallback(() => {
    removeItem(item.variantId);
  }, [item.variantId, removeItem]);

  const lineTotal = useMemo(
    () => variant.price * item.quantity,
    [item.quantity, variant.price]
  );

  return (
    <div className="surface rounded-3xl border border-border-1 p-4">
      <div className="space-y-2">
        <div className="font-display text-lg font-semibold">
          {t(product.name) as string}
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t(`size.${variant.size}`) as string} / {t(`color.${variant.color}`) as string}
        </div>
        <div className="text-sm text-muted-foreground">
          {t(product.shortDescription) as string}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <QuantityStepper
          quantity={item.quantity}
          onChange={handleQuantityChange}
          label={t("cart.quantity") as string}
        />
        <div className="text-end">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("cart.lineTotal") as string}
          </div>
          <div className="text-base font-semibold">
            <Price amount={lineTotal} currency={variant.currency} />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Button type="button" variant="outline" onClick={handleRemove}>
          {t("cart.remove") as string}
        </Button>
      </div>
    </div>
  );
});

export default CartItemRow;
