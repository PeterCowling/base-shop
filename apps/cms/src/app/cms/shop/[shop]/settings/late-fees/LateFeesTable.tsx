import { readOrders } from "@platform-core/repositories/rentalOrders.server";

export default async function LateFeesTable({ shop }: { shop: string }) {
  const orders = await readOrders(shop);
  const charges = orders.filter((o) => o.lateFeeCharged);
  if (charges.length === 0) {
    return <p className="text-sm">No late fees charged.</p>;
  }
  return (
    <table className="mt-4 w-full text-left text-sm">
      <thead>
        <tr>
          <th className="pr-4">Order</th>
          <th className="pr-4">Amount</th>
        </tr>
      </thead>
      <tbody>
        {charges.map((o) => (
          <tr key={o.sessionId}>
            <td className="pr-4">{o.sessionId}</td>
            <td>${o.lateFeeCharged?.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
