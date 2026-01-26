// apps/cover-me-pretty/src/app/account/orders/page.tsx
import {
  ordersMetadata as metadata,
  OrdersPage as Orders,
} from "@acme/ui/account";

import shop from "../../../../shop.json";

export { metadata };

export default function Page() {
  return (
    <Orders
      shopId={shop.id}
      returnsEnabled={shop.returnsEnabled}
      returnPolicyUrl={shop.returnPolicyUrl}
      trackingEnabled={shop.trackingEnabled}
      trackingProviders={shop.trackingProviders}
    />
  );
}
