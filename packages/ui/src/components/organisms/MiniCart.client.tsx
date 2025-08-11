"use client";

import { useCart } from "@platform-core/src/contexts/CartContext";
import * as React from "react";
import { cn } from "../../utils/style";
import { drawerWidthProps } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { Price } from "../atoms/Price";
import { Toast } from "../atoms/Toast";
import {
  Dialog,
  DialogContent,
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
  const lines = Object.entries(cart);
  const subtotal = lines.reduce((s, [, l]) => s + l.sku.price * l.qty, 0);
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

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          style={style}
          className={cn(
            "bg-background fixed top-0 right-0 h-full max-w-full rounded-none border-l p-6 shadow-lg",
            widthClass
          )}
        >
          <DialogTitle className="mb-4">Your Cart</DialogTitle>
          {lines.length === 0 ? (
            <p className="text-muted-foreground text-sm">Cart is empty.</p>
          ) : (
            <div className="flex h-full flex-col gap-4">
              <ul className="grow space-y-3 overflow-y-auto">
                {lines.map(([id, line]) => (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm">
                      {line.sku.title}
                      {line.size && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({line.size})
                        </span>
                      )}
                    </span>
                    <span className="text-sm">× {line.qty}</span>
                    <Button
                      variant="destructive"
                      onClick={() => void handleRemove(id)}
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
        </DialogContent>
      </Dialog>
      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.message}
      />
    </>
  );
}
