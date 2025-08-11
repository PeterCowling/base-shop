// apps/shop-bcd/__tests__/account-orders.test.tsx
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));
jest.mock("@platform-core/orders", () => ({
  __esModule: true,
  getOrdersForCustomer: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: jest.fn(),
}));

import { getCustomerSession } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import OrdersPage from "../src/app/account/orders/page";
import { redirect } from "next/navigation";
import shop from "../shop.json";

describe("/account/orders", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("redirects unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    await OrdersPage();
    expect(getCustomerSession).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Faccount%2Forders",
    );
  });

  it("shows empty state when no orders", async () => {
    const session = { customerId: "cust1", role: "user" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (getOrdersForCustomer as jest.Mock).mockResolvedValue([]);
    const element = await OrdersPage();
    expect(getOrdersForCustomer).toHaveBeenCalledWith(
      shop.id,
      session.customerId
    );
    expect(element.type).toBe("p");
    expect(element.props.children).toBe("No orders yet.");
  });

  it("shows message when orders fetch fails", async () => {
    const session = { customerId: "cust1", role: "user" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    const error = new Error("boom");
    (getOrdersForCustomer as jest.Mock).mockRejectedValue(error);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const element = await OrdersPage();
    expect(getOrdersForCustomer).toHaveBeenCalledWith(
      shop.id,
      session.customerId
    );
    expect(consoleError).toHaveBeenCalled();
    expect(element.type).toBe("p");
    expect(element.props.children).toBe("Unable to load orders.");
    consoleError.mockRestore();
  });

  it("lists customer orders", async () => {
    const session = { customerId: "cust1", role: "user" };
    const orders = [
      { id: "o1", expectedReturnDate: "2024-01-01" },
      { id: "o2" },
    ];
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (getOrdersForCustomer as jest.Mock).mockResolvedValue(orders);
    const element = await OrdersPage();
    expect(getOrdersForCustomer).toHaveBeenCalledWith(
      shop.id,
      session.customerId
    );
    const list = element.props.children[1];
    expect(list.type).toBe("ul");
    expect(list.props.children).toHaveLength(2);
    expect(
      list.props.children.map((li: any) => {
        const child = li.props.children[0].props.children;
        return Array.isArray(child) ? child.join("") : child;
      })
    ).toEqual(["Order: o1", "Order: o2"]);
  });
});
