export default function OrderSummary({ cart }) {
    const subtotal = Object.values(cart).reduce((s, l) => s + l.sku.price * l.qty, 0);
    return (<table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b">
          <th className="py-2">Item</th>
          <th>Qty</th>
          <th className="text-right">Price</th>
        </tr>
      </thead>
      <tbody>
        {Object.values(cart).map((l) => (<tr key={l.sku.id} className="border-b last:border-0">
            <td className="py-2">{l.sku.title}</td>
            <td>{l.qty}</td>
            <td className="text-right">€{l.sku.price * l.qty}</td>
          </tr>))}
      </tbody>
      <tfoot>
        <tr>
          <td />
          <td className="py-2 font-semibold">Total</td>
          <td className="text-right font-semibold">€{subtotal}</td>
        </tr>
      </tfoot>
    </table>);
}
