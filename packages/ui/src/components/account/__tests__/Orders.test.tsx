import { redirect } from "next/navigation";
import { render, screen } from "@testing-library/react";

import { getCustomerSession, hasPermission } from "@acme/auth";
import { getOrdersForCustomer } from "@acme/platform-core/orders";
import {
  getTrackingStatus as getReturnTrackingStatus,
} from "@acme/platform-core/returnAuthorization";
import {
  getTrackingStatus as getShippingTrackingStatus,
} from "@acme/platform-core/shipping";

import OrdersPage from "../Orders";

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: jest.fn(),
}));

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

describe("OrdersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to login when session is missing", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);

    await OrdersPage({ shopId: "1" });

    expect(redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Faccount%2Forders",
    );
    expect(getOrdersForCustomer).not.toHaveBeenCalled();
  });

  it("renders not authorized when lacking permission", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      role: "user",
      customerId: "c1",
    });
    (hasPermission as jest.Mock).mockReturnValue(false);

    const ui = await OrdersPage({ shopId: "1" });
    render(ui);

    expect(screen.getByText("Not authorized.")).toBeInTheDocument();
    expect(getOrdersForCustomer).not.toHaveBeenCalled();
  });

  it("renders empty state when no orders", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      role: "user",
      customerId: "c1",
    });
    (hasPermission as jest.Mock).mockReturnValue(true);
    (getOrdersForCustomer as jest.Mock).mockResolvedValue([]);

    const ui = await OrdersPage({ shopId: "1" });
    render(ui);

    expect(screen.getByText("No orders yet.")).toBeInTheDocument();
  });

  it("renders orders with tracking and returns enabled", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      role: "user",
      customerId: "c1",
    });
    (hasPermission as jest.Mock).mockReturnValue(true);
    (getOrdersForCustomer as jest.Mock).mockResolvedValue([
      {
        id: "o1",
        sessionId: "s1",
        trackingNumber: "TRACK",
        expectedReturnDate: "2024-01-01",
        returnStatus: "processing",
      },
    ]);
    (getShippingTrackingStatus as jest.Mock).mockResolvedValue({
      steps: [{ label: "Shipped", date: "2023-01-01" }],
      status: "delivered",
    });
    (getReturnTrackingStatus as jest.Mock).mockResolvedValue({
      steps: [{ label: "Returned", date: "2024-01-02" }],
    });

    const ui = await OrdersPage({
      shopId: "1",
      returnsEnabled: true,
      trackingProviders: ["ups"],
    });
    render(ui);

    expect(getShippingTrackingStatus).toHaveBeenCalledWith({
      provider: "ups",
      trackingNumber: "TRACK",
    });
    expect(getReturnTrackingStatus).toHaveBeenCalledWith({
      provider: "ups",
      trackingNumber: "TRACK",
    });
    expect(screen.getByText("Order: o1")).toBeInTheDocument();
    expect(screen.getByText("Status: delivered")).toBeInTheDocument();
    expect(screen.getByText("Return: processing")).toBeInTheDocument();
    expect(screen.getByText("Shipped")).toBeInTheDocument();
    expect(screen.getByText("Returned")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start return" }),
    ).toBeInTheDocument();
  });
});

