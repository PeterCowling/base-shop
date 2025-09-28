"use client"; // i18n-exempt -- PB-000 [ttl=2025-12-31]: Next.js directive string

import { useCart } from "@acme/platform-core/contexts/CartContext";
import type { CartLine } from "@acme/types/Cart";
import * as React from "react";
import { cn } from "../../utils/style";
import { drawerWidthProps } from "../../utils/style/drawerWidth";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { Toast } from "../atoms/Toast";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
  DrawerPortal,
} from "../atoms/primitives/drawer";
import { OverlayScrim } from "../atoms";
import { useTranslations } from "@acme/i18n";

/**
 * Fly-out mini cart that shows current cart contents.
 * Trigger element is provided via `trigger` prop.
 */
export interface MiniCartProps {
  trigger: React.ReactNode;
  /**
   * Optional width for the drawer. Accepts a Tailwind width class
   * (e.g. "w-80") or a numeric pixel value.
   */
  width?: string | number;
}

export function MiniCart({ trigger, width = "w-80" }: MiniCartProps) {
  const t = useTranslations();
  const [cart, dispatch] = useCart();
  const [toast, setToast] = React.useState<{ open: boolean; message: string }>(
    { open: false, message: "" }
  );
  const lines = (Object.entries(cart) as [string, CartLine][]).map(
    ([id, line]) => ({ id, ...line })
  );
  const subtotal = lines.reduce((s, l) => s + l.sku.price * l.qty, 0);
  const { widthClass, style } = drawerWidthProps(width);

  const handleRemove = async (id: string) => {
    try {
      await dispatch({ type: "remove", id });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(t("cart.updateFailed"));
      setToast({ open: true, message });
    }
  };

  const handleQty = async (id: string, qty: number) => {
    try {
      await dispatch({ type: "setQty", id, qty });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(t("cart.updateFailed"));
      setToast({ open: true, message });
    }
  };

  return (
      <Drawer>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerPortal>
          <OverlayScrim />
          <DrawerContent
          style={style}
          side="right" /* i18n-exempt -- PB-000 [ttl=2025-12-31]: UI enum value */
          width={widthClass}
          className={cn("rounded-none p-6")} // i18n-exempt -- PB-000 [ttl=2025-12-31]: CSS utility classes only
        >
          <DrawerTitle className="mb-4 text-lg font-semibold">{t("cart.yourCart")}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("cart.description")}
          </DrawerDescription>
          {lines.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("cart.empty")}</p>
          ) : (
            <div className="h-full">
              <ul className="grow space-y-3 overflow-y-auto">
                {lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm">
                      {line.sku.title}
                      {line.size && (
                        <span className="ms-1 text-muted">({line.size})</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => void handleQty(line.id, line.qty - 1)}
                        className="px-2 py-1 text-xs min-h-10 min-w-10"
                        aria-label={String(t("cart.decreaseQty"))}
                      >
                        -
                      </Button>
                      <span className="text-sm">{line.qty}</span>
                      <Button
                        onClick={() => void handleQty(line.id, line.qty + 1)}
                        className="px-2 py-1 text-xs min-h-10 min-w-10"
                        aria-label={String(t("cart.increaseQty"))}
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="destructive" /* i18n-exempt -- PB-000 [ttl=2025-12-31]: UI enum value */
                      onClick={() => void handleRemove(line.id)}
                      className="px-2 py-1 text-xs"
                    >
                      {t("cart.remove")}
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="border-t pt-4 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>{t("cart.subtotal")}</span>
                  <Price amount={subtotal} />
                </div>
              </div>
            </div>
          )}
          <Toast
            open={toast.open}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
            message={toast.message}
          />
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
  );
}
