"use client";

import { useCart } from "@/contexts/CartContext";
import * as React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../atoms-shadcn";
import { Price } from "../atoms/Price";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

/**
 * Fly-out mini cart that shows current cart contents.
 * Trigger element is provided via `trigger` prop.
 */
export interface MiniCartProps {
  trigger: React.ReactNode;
  /** Optional width class for the drawer */
  width?: string;
}

export function MiniCart({ trigger, width = "w-80" }: MiniCartProps) {
  const [cart, dispatch] = useCart();
  const lines = Object.values(cart);
  const subtotal = lines.reduce((s, l) => s + l.sku.price * l.qty, 0);

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "bg-background fixed top-0 right-0 h-full max-w-full rounded-none border-l p-6 shadow-lg",
          width
        )}
      >
        <DialogTitle className="mb-4">Your Cart</DialogTitle>
        {lines.length === 0 ? (
          <p className="text-muted-foreground text-sm">Cart is empty.</p>
        ) : (
          <div className="flex h-full flex-col gap-4">
            <ul className="grow space-y-3 overflow-y-auto">
              {lines.map((line) => (
                <li
                  key={line.sku.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm">{line.sku.title}</span>
                  <span className="text-sm">× {line.qty}</span>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      dispatch({ type: "remove", id: line.sku.id })
                    }
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
  );
}
