// apps/shop-abc/__tests__/accountOrders.test.tsx
jest.mock("@ui/components/account/Orders", () => ({
  __esModule: true,
  default: jest.fn(() => null),
  metadata: { title: "Orders" },
}));

import OrdersPage, { metadata } from "../src/app/account/orders/page";
import Orders from "@ui/components/account/Orders";
import shop from "../shop.json";

describe("/account/orders page", () => {
  it("renders Orders component with shop config", () => {
    const element = OrdersPage();
    expect(element.type).toBe(Orders);
    expect(element.props).toEqual({
      shopId: shop.id,
      returnsEnabled: shop.returnsEnabled && shop.luxuryFeatures.returns,
      returnPolicyUrl: shop.returnPolicyUrl,
      trackingEnabled: shop.trackingEnabled,
      trackingProviders: shop.trackingProviders,
    });
  });

  it("re-exports metadata", () => {
    expect(metadata).toEqual({ title: "Orders" });
  });
});
