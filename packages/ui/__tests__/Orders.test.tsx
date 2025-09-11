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

jest.mock("@platform-core/shipping", () => ({
  __esModule: true,
  getTrackingStatus: jest.fn(),
}));

jest.mock("@platform-core/returnAuthorization", () => ({
  __esModule: true,
  getTrackingStatus: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: jest.fn(),
}));

import { getCustomerSession, hasPermission } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { getTrackingStatus as getShippingTrackingStatus } from "@platform-core/shipping";
import { getTrackingStatus as getReturnTrackingStatus } from "@platform-core/returnAuthorization";
import OrdersPage from "../src/components/account/Orders";
import StartReturnButton from "../src/components/account/StartReturnButton";
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

describe("OrdersPage rendering", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const shopId = "shop1";

  it("renders empty state when no orders", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    (hasPermission as jest.Mock).mockReturnValue(true);
    (getOrdersForCustomer as jest.Mock).mockResolvedValue([]);
    const element = await OrdersPage({ shopId });
    expect(element.type).toBe("p");
    expect(element.props.children).toBe("No orders yet.");
  });

  it("shows return policy and StartReturnButton when returns enabled", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    (hasPermission as jest.Mock).mockReturnValue(true);
    (getOrdersForCustomer as jest.Mock).mockResolvedValue([
      { id: "o1", sessionId: "s1" },
    ]);
    const returnPolicyUrl = "https://example.com/policy";
    const element = await OrdersPage({
      shopId,
      returnsEnabled: true,
      returnPolicyUrl,
    });
    const children = element.props.children;
    const policy = children[1];
    expect(policy.type).toBe("p");
    const link = policy.props.children;
    expect(link.type).toBe("a");
    expect(link.props.href).toBe(returnPolicyUrl);
    const list = children[children.length - 1];
    const listItem = Array.isArray(list.props.children)
      ? list.props.children[0]
      : list.props.children;
    const liChildren = (
      Array.isArray(listItem.props.children)
        ? listItem.props.children
        : [listItem.props.children]
    ).filter(Boolean);
    const button = liChildren.find((c) => c.type === StartReturnButton);
    expect(button).toBeDefined();
  });

  it("renders shipping and return status lines", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    (hasPermission as jest.Mock).mockReturnValue(true);
    (getOrdersForCustomer as jest.Mock).mockResolvedValue([
      {
        id: "o1",
        sessionId: "s1",
        trackingNumber: "TN123",
        returnStatus: "Processing",
      },
    ]);
    (getShippingTrackingStatus as jest.Mock).mockResolvedValue({
      steps: [],
      status: "Delivered",
    });
    (getReturnTrackingStatus as jest.Mock).mockResolvedValue({ steps: [] });
    const element = await OrdersPage({ shopId, trackingProviders: ["ups"] });
    expect(getShippingTrackingStatus).toHaveBeenCalledWith({
      provider: "ups",
      trackingNumber: "TN123",
    });
    expect(getReturnTrackingStatus).toHaveBeenCalledWith({
      provider: "ups",
      trackingNumber: "TN123",
    });
    const list = element.props.children[element.props.children.length - 1];
    const listItem = Array.isArray(list.props.children)
      ? list.props.children[0]
      : list.props.children;
    const liChildren = (
      Array.isArray(listItem.props.children)
        ? listItem.props.children
        : [listItem.props.children]
    ).filter(Boolean);
    const statusPara = liChildren.find(
      (c) => c.type === "p" && c.props.children[0] === "Status: "
    );
    expect(statusPara.props.children[1]).toBe("Delivered");
    const returnPara = liChildren.find(
      (c) => c.type === "p" && c.props.children[0] === "Return: "
    );
    expect(returnPara.props.children[1]).toBe("Processing");
  });
});
