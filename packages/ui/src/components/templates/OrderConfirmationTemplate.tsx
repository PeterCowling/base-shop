import type { CartLine, CartState } from "@acme/platform-core/cart";
import * as React from "react";
import { cn } from "../../utils/style";
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
  const lines = (Object.entries(cart) as [string, CartLine][]).map(
    ([id, line]) => ({ id, ...line })
  );
  const subtotal = lines.reduce(
    (s, l) => s + (l.sku.price ?? 0) * l.qty,
    0,
  );
  const deposit = lines.reduce((s, l) => s + (l.sku.deposit ?? 0) * l.qty, 0);

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <h2 className="text-xl font-semibold">Order Confirmation</h2>
      <p>
        Thank you for your order. Your reference is
        <span className="font-mono"> {orderId}</span>.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-start">
            <th className="py-2">Item</th>
            <th>Qty</th>
            <th className="text-end">Price</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} className="border-b last:border-0">
              <td className="py-2">
                {l.sku.title}
                {l.size && (
                  <span
                    className="ms-1 text-xs text-muted"
                    data-token="--color-muted"
                  >
                    ({l.size})
                  </span>
                )}
              </td>
              <td>{l.qty}</td>
              <td className="text-end">
                <Price amount={(l.sku.price ?? 0) * l.qty} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td className="py-2">Deposit</td>
            <td className="text-end">
              <Price amount={deposit} />
            </td>
          </tr>
          <tr>
            <td />
            <td className="py-2 font-semibold">Total</td>
            <td className="text-end font-semibold">
              <Price amount={subtotal + deposit} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
