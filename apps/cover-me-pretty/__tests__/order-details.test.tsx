// apps/cover-me-pretty/__tests__/order-details.test.tsx

jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

jest.mock("@acme/platform-core/orders", () => ({
  __esModule: true,
  getOrdersForCustomer: jest.fn(),
}));

jest.mock("@acme/platform-core/returnLogistics", () => ({
  __esModule: true,
  getReturnLogistics: jest.fn(),
}));

jest.mock("@acme/ui/components/organisms/OrderTrackingTimeline", () => ({
  __esModule: true,
  OrderTrackingTimeline: (props: unknown) => ({
    type: "OrderTrackingTimeline",
    props,
  }),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: jest.fn(),
}));

import Page from "../src/app/account/orders/[id]/page";
import { getCustomerSession } from "@acme/auth";
import { getOrdersForCustomer } from "@acme/platform-core/orders";
import { getReturnLogistics } from "@acme/platform-core/returnLogistics";
import { OrderTrackingTimeline } from "@acme/ui/components/organisms/OrderTrackingTimeline";
import { redirect } from "next/navigation";
import shop from "../shop.json";

type TimelineChild = {
  type?: unknown;
  props?: {
    steps?: Array<{ name: string }>;
    [key: string]: unknown;
  };
};

describe("order details page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (global.fetch as unknown) = jest.fn();
  });

  it("renders tracking timeline when order found", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    const order = { id: "order1" };
    (getOrdersForCustomer as jest.Mock).mockResolvedValue([order]);
    (getReturnLogistics as jest.Mock).mockResolvedValue({ mobileApp: false });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ steps: [{ name: "Ordered" }] }),
    });

    const element = await Page({ params: { id: "order1" } });

    expect(getOrdersForCustomer).toHaveBeenCalledWith(shop.id, "cust1");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/orders/order1/tracking",
      { cache: "no-store" },
    );
    const timeline = (element.props.children as TimelineChild[]).find(
      (child) => child?.type === OrderTrackingTimeline,
    );
    expect(timeline).toBeDefined();
    expect(timeline.props).toEqual(
      expect.objectContaining({ steps: [{ name: "Ordered" }] }),
    );
  });

  it("shows not found when order is missing", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    (getOrdersForCustomer as jest.Mock).mockResolvedValue([]);
    (getReturnLogistics as jest.Mock).mockResolvedValue({});

    const element = await Page({ params: { id: "order1" } });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(element.type).toBe("p");
    expect(element.props.children).toBe("Order not found");
  });

  it("redirects unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);

    await Page({ params: { id: "order1" } });

    expect(redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Faccount%2Forders%2Forder1",
    );
    expect(getOrdersForCustomer).not.toHaveBeenCalled();
  });

  it("handles errors from getOrdersForCustomer", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    (getOrdersForCustomer as jest.Mock).mockRejectedValue(new Error("boom"));
    (getReturnLogistics as jest.Mock).mockResolvedValue({});
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ steps: [] }),
    });

    const element = await Page({ params: { id: "order1" } });

    expect(element.type).toBe("p");
    expect(element.props.children).toBe("Failed to load order");
  });
});
