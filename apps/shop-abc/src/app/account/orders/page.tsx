// apps/shop-abc/src/app/account/orders/page.tsx
import Orders, { metadata } from "@ui/components/account/Orders";
import shop from "../../../../shop.json";

export { metadata };

export default function Page() {
  return (
    <Orders
      shopId={shop.id}
      returnsEnabled={shop.returnsEnabled}
      returnPolicyUrl={shop.returnPolicyUrl}
      orderTrackingEnabled={shop.orderTrackingEnabled}
    />
  );
}
