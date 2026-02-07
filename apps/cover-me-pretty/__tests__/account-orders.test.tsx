// apps/cover-me-pretty/__tests__/account-orders.test.tsx
jest.mock("@acme/ui/account", () => ({
  __esModule: true,
  OrdersPage: jest.fn(() => null),
  ordersMetadata: { title: "Orders" },
}));

import OrdersPage, { metadata } from "../src/app/account/orders/page";
import { OrdersPage as Orders } from "@acme/ui/account";
import shop from "../shop.json";

describe("/account/orders page", () => {
  it("renders Orders component with shop config", () => {
    const element = OrdersPage();
    expect(element.type).toBe(Orders);
    expect(element.props).toEqual({
      shopId: shop.id,
      returnsEnabled: shop.returnsEnabled,
      returnPolicyUrl: shop.returnPolicyUrl,
      trackingEnabled: shop.trackingEnabled,
      trackingProviders: shop.trackingProviders,
    });
  });

  it("re-exports metadata", () => {
    expect(metadata).toEqual({ title: "Orders" });
  });
});
