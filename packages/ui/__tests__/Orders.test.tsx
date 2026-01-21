// packages/ui/__tests__/Orders.test.tsx
import { redirect } from "next/navigation";
import { render, screen } from "@testing-library/react";

import { getCustomerSession, hasPermission } from "@acme/auth";
import { getOrdersForCustomer } from "@acme/platform-core/orders";
import { getTrackingStatus as getReturnTrackingStatus } from "@acme/platform-core/returnAuthorization";
import { getTrackingStatus as getShippingTrackingStatus } from "@acme/platform-core/shipping";

import OrdersPage from "../src/components/account/Orders";
import StartReturnButton from "../src/components/account/StartReturnButton";

jest.mock("@acme/auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  hasPermission: jest.fn(),
}));

jest.mock("@acme/platform-core/orders", () => ({
  __esModule: true,
  getOrdersForCustomer: jest.fn(),
}));

jest.mock("@acme/platform-core/shipping", () => ({
  __esModule: true,
  getTrackingStatus: jest.fn(),
}));

jest.mock("@acme/platform-core/returnAuthorization", () => ({
  __esModule: true,
  getTrackingStatus: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: jest.fn(),
}));

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
    render(element);
    expect(hasPermission).toHaveBeenCalledWith("viewer", "view_orders");
    expect(getOrdersForCustomer).not.toHaveBeenCalled();
    expect(screen.getByText("Not authorized.")).toBeInTheDocument();
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
    render(element);
    expect(hasPermission).toHaveBeenCalledWith("customer", "view_orders");
    expect(screen.getByTestId("orders-list")).toBeInTheDocument();
  });

  it("prevents roles without view_orders from seeing orders", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "CatalogManager",
    });
    (hasPermission as jest.Mock).mockReturnValue(false);
    const element = await OrdersPage({ shopId });
    render(element);
    expect(hasPermission).toHaveBeenCalledWith(
      "CatalogManager",
      "view_orders",
    );
    expect(getOrdersForCustomer).not.toHaveBeenCalled();
    expect(screen.getByText("Not authorized.")).toBeInTheDocument();
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
    render(element);
    expect(screen.getByText("No orders yet.")).toBeInTheDocument();
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
    render(element);
    const link = screen.getByRole("link", { name: "Return policy" });
    expect(link).toHaveAttribute("href", returnPolicyUrl);
    expect(screen.getByRole("button", { name: "Start return" })).toBeInTheDocument();
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
        returnStatus: "processing",
      },
    ]);
    (getShippingTrackingStatus as jest.Mock).mockResolvedValue({
      steps: [],
      status: "delivered",
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
    render(element);
    expect(screen.getByText("Order: o1")).toBeInTheDocument();
    expect(screen.getByText("Status: delivered")).toBeInTheDocument();
    expect(screen.getByText("Return: processing")).toBeInTheDocument();
  });
});
