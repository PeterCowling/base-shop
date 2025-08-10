// apps/shop-bcd/src/app/account/orders/page.tsx
import OrdersPage, { metadata } from "@ui/components/account/Orders";
import shop from "../../../../shop.json";

export { metadata };

export default function Page() {
  return OrdersPage({ shopId: shop.id });
}
