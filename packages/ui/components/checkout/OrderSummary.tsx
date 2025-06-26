// src/components/checkout/OrderSummary.tsx
import { CartState } from "@/contexts/CartContext";

export default function OrderSummary({ cart }: { cart: CartState }) {
  const subtotal = Object.values(cart).reduce(
    (s, l) => s + l.sku.price * l.qty,
    0
  );
  const deposit = Object.values(cart).reduce(
    (s, l) => s + (l.sku.deposit ?? 0) * l.qty,
    0
  );
  return (
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
            <td className="text-right">€{l.sku.price * l.qty}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td />
          <td className="py-2">Deposit</td>
          <td className="text-right">€{deposit}</td>
        </tr>
        <tr>
          <td />
          <td className="py-2 font-semibold">Total</td>
          <td className="text-right font-semibold">
            €{subtotal + deposit}
          </td>{" "}
        </tr>
      </tfoot>
    </table>
  );
}
