import type { CartState } from "@types";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
import { Price } from "../atoms/Price";
import { QuantityInput } from "../molecules/QuantityInput";

export interface CartTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  cart: CartState;
  onQtyChange?: (id: string, qty: number) => void;
  onRemove?: (id: string) => void;
}

export function CartTemplate({
  cart,
  onQtyChange,
  onRemove,
  className,
  ...props
}: CartTemplateProps) {
  const lines = Object.values(cart);
  const subtotal = lines.reduce((s, l) => s + l.sku.price * l.qty, 0);
  const deposit = lines.reduce((s, l) => s + (l.sku.deposit ?? 0) * l.qty, 0);

  if (!lines.length) {
    return (
      <p className={cn("p-8 text-center", className)}>Your cart is empty.</p>
    );
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <h2 className="text-xl font-semibold">Your Bag</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Item</th>
            <th>Qty</th>
            <th className="text-right">Price</th>
            {onRemove && <th className="sr-only">Remove</th>}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.sku.id} className="border-b last:border-0">
              <td className="py-2">
                <div className="flex items-center gap-4">
                  <div className="relative hidden h-12 w-12 sm:block">
                    <Image
                      src={line.sku.image}
                      alt={line.sku.title}
                      fill
                      sizes="3rem"
                      className="rounded-md object-cover"
                    />
                  </div>
                  {line.sku.title}
                </div>
              </td>
              <td>
                <QuantityInput
                  value={line.qty}
                  onChange={(v) => onQtyChange?.(line.sku.id, v)}
                  className="justify-center"
                />
              </td>
              <td className="text-right">
                <Price amount={line.sku.price * line.qty} />
              </td>
              {onRemove && (
                <td className="text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(line.sku.id)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td className="py-2">Deposit</td>
            <td className="text-right">
              <Price amount={deposit} />
            </td>
            {onRemove && <td />}
          </tr>
          <tr>
            <td />
            <td className="py-2 font-semibold">Total</td>
            <td className="text-right font-semibold">
              <Price amount={subtotal + deposit} />
            </td>
            {onRemove && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
