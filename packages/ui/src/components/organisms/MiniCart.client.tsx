"use client";

import { useCart } from "@acme/platform-core/contexts/CartContext";
import type { CartLine } from "@acme/types/Cart";
import * as React from "react";
import { cn } from "../../utils/style";
import { drawerWidthProps } from "../../utils/style/drawerWidth";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { Toast } from "../atoms/Toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../atoms/primitives/dialog";

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
      const message =
        err instanceof Error ? err.message : "Failed to update cart";
      setToast({ open: true, message });
    }
  };

  const handleQty = async (id: string, qty: number) => {
    try {
      await dispatch({ type: "setQty", id, qty });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update cart";
      setToast({ open: true, message });
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          style={style}
          className={cn(
            "bg-surface-3 fixed top-0 right-0 h-full max-w-full rounded-none border-l border-border-2 p-6 shadow-elevation-4",
            widthClass
          )}
        >
          <DialogTitle className="mb-4">Your Cart</DialogTitle>
          <DialogDescription className="sr-only">
            Review items in your cart
          </DialogDescription>
          {lines.length === 0 ? (
            <p className="text-muted-foreground text-sm">Cart is empty.</p>
          ) : (
            <div className="flex h-full flex-col gap-4">
              <ul className="grow space-y-3 overflow-y-auto">
                {lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm">
                      {line.sku.title}
                      {line.size && (
                        <span className="ml-1 text-muted">({line.size})</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => void handleQty(line.id, line.qty - 1)}
                        className="px-2 py-1 text-xs"
                        aria-label="Decrease quantity"
                      >
                        -
                      </Button>
                      <span className="text-sm">{line.qty}</span>
                      <Button
                        onClick={() => void handleQty(line.id, line.qty + 1)}
                        className="px-2 py-1 text-xs"
                        aria-label="Increase quantity"
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => void handleRemove(line.id)}
                      className="px-2 py-1 text-xs"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="border-t pt-4 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal</span>
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
        </DialogContent>
      </Dialog>
    </>
  );
}
