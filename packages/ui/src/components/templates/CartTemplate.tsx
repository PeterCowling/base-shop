"use client";
import type { CartLine, CartState } from "@acme/platform-core/cart";
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
  const lines = (Object.entries(cart) as [string, CartLine][]).map(
    ([id, line]) => ({ id, ...line })
  );
  const subtotal = lines.reduce(
    (s, l) => s + (l.sku.price ?? 0) * l.qty,
    0,
  );
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
          {lines.map((line) => {
            const media = line.sku.media?.[0];
            return (
              <tr key={line.id} className="border-b last:border-0">
                <td className="py-2">
                  <div className="flex items-center gap-4">
                    {media && (
                      <div className="relative hidden h-12 w-12 sm:block">
                        {media.type === "image" ? (
                          <Image
                            src={media.url}
                            alt={line.sku.title ?? ""}
                            fill
                            sizes="3rem"
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="h-full w-full rounded-md object-cover"
                            muted
                            playsInline
                          />
                        )}
                      </div>
                    )}
                    {line.sku.title}
                    {line.size && (
                      <span className="ml-1 text-xs text-muted" data-token="--color-muted">
                        ({line.size})
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  {onQtyChange ? (
                    <QuantityInput
                      value={line.qty}
                      onChange={(v) => onQtyChange(line.id, v)}
                      className="justify-center"
                    />
                  ) : (
                    <div className="flex justify-center">
                      <span className="min-w-[2ch] text-center">{line.qty}</span>
                    </div>
                  )}
                </td>
                <td className="text-right">
                  <Price amount={(line.sku.price ?? 0) * line.qty} />
                </td>
                {onRemove && (
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(line.id)}
                      className="text-danger hover:underline"
                      data-token="--color-danger"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
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
