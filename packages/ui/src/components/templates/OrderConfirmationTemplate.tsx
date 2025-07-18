import type { CartState } from "@types";
import * as React from "react";
import { cn } from "../../utils/cn";
import { Price } from "../atoms/Price";

export interface OrderConfirmationTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  orderId: string;
  cart: CartState;
}

export function OrderConfirmationTemplate({
  orderId,
  cart,
  className,
  ...props
}: OrderConfirmationTemplateProps) {
  const subtotal = Object.values(cart).reduce(
    (s, l) => s + l.sku.price * l.qty,
    0
  );
  const deposit = Object.values(cart).reduce(
    (s, l) => s + (l.sku.deposit ?? 0) * l.qty,
    0
  );

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <h2 className="text-xl font-semibold">Order Confirmation</h2>
      <p>
        Thank you for your order. Your reference is
        <span className="font-mono"> {orderId}</span>.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Item</th>
            <th>Qty</th>
            <th className="text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(cart).map((l) => (
            <tr key={l.sku.id} className="border-b last:border-0">
              <td className="py-2">{l.sku.title}</td>
              <td>{l.qty}</td>
              <td className="text-right">
                <Price amount={l.sku.price * l.qty} />
              </td>
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
          </tr>
          <tr>
            <td />
            <td className="py-2 font-semibold">Total</td>
            <td className="text-right font-semibold">
              <Price amount={subtotal + deposit} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
