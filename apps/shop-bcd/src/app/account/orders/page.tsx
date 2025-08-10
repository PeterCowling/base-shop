// apps/shop-bcd/src/app/account/orders/page.tsx
import { Orders } from "@acme/ui";
import shop from "../../../../shop.json";

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return <Orders shopId={shop.id} />;
}
