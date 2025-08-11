// apps/cms/src/app/cms/orders/[shop]/page.tsx
import { readOrders, markReturned, markRefunded } from "@acme/orders";

export default async function ShopOrdersPage({
  params,
}: {
  params: { shop: string };
}) {
  const shop = params.shop;
  const orders = await readOrders(shop);

  async function returnAction(formData: FormData) {
    "use server";
    const sessionId = formData.get("sessionId")?.toString();
    if (sessionId) {
      await markReturned(shop, sessionId);
    }
  }

  async function refundAction(formData: FormData) {
    "use server";
    const sessionId = formData.get("sessionId")?.toString();
    if (sessionId) {
      await markRefunded(shop, sessionId);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Orders for {shop}</h2>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id} className="space-y-2 rounded border p-4">
            <div>Order: {o.id}</div>
            {o.expectedReturnDate && (
              <div>Return: {o.expectedReturnDate}</div>
            )}
            <form action={returnAction}>
              <input type="hidden" name="sessionId" value={o.sessionId} />
              <button type="submit" className="text-sm text-primary underline">
                Mark Returned
              </button>
            </form>
            <form action={refundAction}>
              <input type="hidden" name="sessionId" value={o.sessionId} />
              <button type="submit" className="text-sm text-primary underline">
                Refund
              </button>
            </form>
          </li>
        ))}
        {orders.length === 0 && <li>No orders found.</li>}
      </ul>
    </div>
  );
}
