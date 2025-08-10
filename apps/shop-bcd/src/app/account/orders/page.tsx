// apps/shop-bcd/src/app/account/orders/page.tsx
import { getCustomerSession } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import shop from "../../../../shop.json";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const session = await getCustomerSession();
  if (!session) return <p>Please log in to view your orders.</p>;
  let orders;
  try {
    orders = await getOrdersForCustomer(shop.id, session.customerId);
  } catch (error) {
    console.error("Failed to load orders", error);
    return <p className="p-6">Unable to load orders.</p>;
  }
  if (!orders.length) return <p className="p-6">No orders yet.</p>;
  return (
    <ul className="space-y-2 p-6">
      {orders.map((o) => (
        <li key={o.id} className="rounded border p-4">
          <div>Order: {o.id}</div>
          {o.expectedReturnDate && <div>Return: {o.expectedReturnDate}</div>}
        </li>
      ))}
    </ul>
  );
}
