// packages/ui/__tests__/Orders.test.tsx
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  hasPermission: jest.fn(),
}));

jest.mock("@platform-core/orders", () => ({
  __esModule: true,
  getOrdersForCustomer: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: jest.fn(),
}));

import { getCustomerSession, hasPermission } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import OrdersPage from "../src/components/account/Orders";
import { redirect } from "next/navigation";

describe("OrdersPage permissions", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const shopId = "shop1";

  it("redirects unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    await OrdersPage({ shopId });
    expect(redirect).toHaveBeenCalled();
  });

  it("hides orders when lacking permission", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "viewer",
    });
    (hasPermission as jest.Mock).mockReturnValue(false);
    const element = await OrdersPage({ shopId });
    expect(hasPermission).toHaveBeenCalledWith("viewer", "view_orders");
    expect(getOrdersForCustomer).not.toHaveBeenCalled();
    expect(element.type).toBe("p");
    expect(element.props.children).toBe("Not authorized.");
  });

  it("shows orders when permitted", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    (hasPermission as jest.Mock).mockReturnValue(true);
    (getOrdersForCustomer as jest.Mock).mockResolvedValue([
      { id: "o1" },
    ]);
    const element = await OrdersPage({ shopId });
    expect(hasPermission).toHaveBeenCalledWith("customer", "view_orders");
    const children = element.props.children;
    const list = children[children.length - 1];
    expect(list.type).toBe("ul");
  });

  it("prevents roles without view_orders from seeing orders", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "CatalogManager",
    });
    (hasPermission as jest.Mock).mockReturnValue(false);
    const element = await OrdersPage({ shopId });
    expect(hasPermission).toHaveBeenCalledWith(
      "CatalogManager",
      "view_orders",
    );
    expect(getOrdersForCustomer).not.toHaveBeenCalled();
    expect(element.type).toBe("p");
    expect(element.props.children).toBe("Not authorized.");
  });
});
