// i18n-exempt file -- CMS-9999 [ttl=2026-12-31]: Header cart icon/summary; detailed i18n planned with nav redesign
"use client";

import * as React from "react";

import { useTranslations } from "@acme/i18n";
import { useCart } from "@acme/platform-core/contexts/CartContext";
import type { CartLine } from "@acme/types/Cart";

import { Price } from "../../atoms/Price";
import { MiniCart } from "../../organisms/MiniCart.client";

export interface HeaderCartProps {
  /** Whether to show the textual cart label next to the icon. */
  showLabel?: boolean;
  /** Whether to show the cart subtotal next to the icon. */
  showSubtotal?: boolean;
}

export default function HeaderCart({
  showLabel = true,
  showSubtotal = false,
}: HeaderCartProps) {
  const t = useTranslations();
  const [cart] = useCart() as [Record<string, CartLine>, unknown];

  const entries = React.useMemo(
    () => Object.values(cart ?? {}) as CartLine[],
    [cart],
  );

  const quantity = React.useMemo(
    () => entries.reduce((sum, line) => sum + line.qty, 0),
    [entries],
  );

  const subtotal = React.useMemo(
    () => entries.reduce((sum, line) => sum + line.sku.price * line.qty, 0),
    [entries],
  );

  const label = t("header.cart") as string;

  const trigger = (
    <button
      type="button"
      className="relative inline-flex items-center gap-2 min-h-10 min-w-10"
      aria-label={label}
    >
      <span aria-hidden>🛒</span>
      {showLabel && (
        <span>
          {label}
        </span>
      )}
      {quantity > 0 && (
        <span
          className="absolute -top-2 -end-3 rounded-full px-1.5 text-xs bg-danger text-danger-foreground"
          data-token="--color-danger" // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: design token identifier only; not user copy
        >
          <span data-token="--color-danger-fg">{quantity}</span>
        </span>
      )}
      {showSubtotal && subtotal > 0 && (
        <span className="ms-2 text-xs text-muted-foreground">
          {/* i18n-exempt -- CMS-9999 [ttl=2026-12-31]: numeric subtotal rendering only; label handled by surrounding UI */}
          <Price amount={subtotal} />
        </span>
      )}
    </button>
  );

  return <MiniCart trigger={trigger} />;
}
