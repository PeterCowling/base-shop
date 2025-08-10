import { getCustomerSession } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";

export interface OrdersProps {
  shopId: string;
  title?: string;
  loginMessage?: string;
  noOrdersMessage?: string;
}

export async function Orders({
  shopId,
  title = "Orders",
  loginMessage = "Please log in to view your orders.",
  noOrdersMessage = "No orders yet.",
}: OrdersProps) {
  const session = await getCustomerSession();
  if (!session) return <p>{loginMessage}</p>;
  const orders = await getOrdersForCustomer(shopId, session.customerId);
  if (!orders.length) return <p className="p-6">{noOrdersMessage}</p>;
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl">{title}</h1>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id} className="rounded border p-4">
            <div>Order: {o.id}</div>
            {o.expectedReturnDate && <div>Return: {o.expectedReturnDate}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
