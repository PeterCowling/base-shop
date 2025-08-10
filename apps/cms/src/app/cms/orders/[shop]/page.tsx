import { listOrders, setRefunded, setReturned } from "@platform-core/orders";

async function markReturned(formData: FormData) {
  "use server";
  const shop = String(formData.get("shop"));
  const sessionId = String(formData.get("sessionId"));
  await setReturned(shop, sessionId);
}

async function markRefunded(formData: FormData) {
  "use server";
  const shop = String(formData.get("shop"));
  const sessionId = String(formData.get("sessionId"));
  await setRefunded(shop, sessionId);
}

export default async function OrdersPage({ params }: { params: { shop: string } }) {
  const shop = params.shop;
  const orders = await listOrders(shop);
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Orders for {shop}</h2>
      <ul className="space-y-4">
        {orders.map((o) => (
          <li key={o.id} className="rounded border p-4">
            <div className="mb-2">Order: {o.id}</div>
            {o.returnedAt ? (
              <div className="text-sm text-gray-600">Returned: {o.returnedAt}</div>
            ) : (
              <form action={markReturned} className="mb-2">
                <input type="hidden" name="shop" value={shop} />
                <input type="hidden" name="sessionId" value={o.sessionId} />
                <button className="rounded bg-blue-600 px-2 py-1 text-white">
                  Mark Returned
                </button>
              </form>
            )}
            {o.refundedAt ? (
              <div className="text-sm text-gray-600">Refunded: {o.refundedAt}</div>
            ) : (
              <form action={markRefunded}>
                <input type="hidden" name="shop" value={shop} />
                <input type="hidden" name="sessionId" value={o.sessionId} />
                <button className="rounded bg-green-600 px-2 py-1 text-white">
                  Mark Refunded
                </button>
              </form>
            )}
          </li>
        ))}
        {orders.length === 0 && <li>No orders</li>}
      </ul>
    </div>
  );
}
