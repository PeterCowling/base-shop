import type { NextRequest } from "next/server";
import { jest } from "@jest/globals";

import { readShop } from "@acme/platform-core/repositories/shops.server";
import { getUserById, setStripeSubscriptionId } from "@acme/platform-core/repositories/users";
import { stripe } from "@acme/stripe";

afterEach(() => {
  jest.clearAllMocks();
});

jest.mock("@acme/stripe", () => ({
  stripe: {
    subscriptions: {
      update: jest.fn(),
    },
  },
}));

jest.mock("@acme/platform-core/repositories/shops.server", () => ({
  readShop: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/users", () => ({
  getUserById: jest.fn(),
  setStripeSubscriptionId: jest.fn(),
}));

const SHOP = {
  subscriptionsEnabled: true,
  billingProvider: "stripe",
  rentalSubscriptions: [{ id: "plan1" }],
};

const makeReq = (body: unknown) =>
  ({
    json: async () => body,
    nextUrl: { searchParams: new URLSearchParams([["shop", "bcd"]]) },
  }) as unknown as NextRequest;

describe("/api/subscription/change POST", () => {
  test("updates subscription and persists id", async () => {
    (readShop as jest.Mock).mockResolvedValue(SHOP);
    (getUserById as jest.Mock).mockResolvedValue({ id: "u1", stripeSubscriptionId: "subOld" });
    (stripe.subscriptions.update as jest.Mock).mockResolvedValue({ id: "subNew", status: "active" });

    const { POST } = await import("../src/api/subscription/change/route");
    const res = await POST(makeReq({ userId: "u1", priceId: "p1", planId: "plan1" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "subNew", status: "active" });
    expect(stripe.subscriptions.update).toHaveBeenCalledWith("subOld", {
      items: [{ price: "p1" }],
      prorate: true,
    });
    expect(setStripeSubscriptionId).toHaveBeenCalledWith("u1", "subNew", "bcd");
    const updateOrder = (stripe.subscriptions.update as jest.Mock).mock.invocationCallOrder[0];
    const setOrder = (setStripeSubscriptionId as jest.Mock).mock.invocationCallOrder[0];
    expect(updateOrder).toBeLessThan(setOrder);
  });

  test("returns 400 on missing params", async () => {
    const { POST } = await import("../src/api/subscription/change/route");
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing parameters" });
  });

  test("returns 403 when subscriptions disabled", async () => {
    (readShop as jest.Mock).mockResolvedValue({ subscriptionsEnabled: false });
    const { POST } = await import("../src/api/subscription/change/route");
    const res = await POST(makeReq({ userId: "u1", priceId: "p1", planId: "plan1" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Subscriptions disabled" });
  });

  test("returns 400 when billing provider missing", async () => {
    (readShop as jest.Mock).mockResolvedValue({ subscriptionsEnabled: true, billingProvider: "other" });
    const { POST } = await import("../src/api/subscription/change/route");
    const res = await POST(makeReq({ userId: "u1", priceId: "p1", planId: "plan1" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Billing not enabled" });
  });

  test("returns 404 when user missing", async () => {
    (readShop as jest.Mock).mockResolvedValue(SHOP);
    (getUserById as jest.Mock).mockResolvedValue(undefined);
    const { POST } = await import("../src/api/subscription/change/route");
    const res = await POST(makeReq({ userId: "u1", priceId: "p1", planId: "plan1" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Subscription not found" });
  });

  test("returns 404 when plan not found", async () => {
    (readShop as jest.Mock).mockResolvedValue({ ...SHOP, rentalSubscriptions: [] });
    (getUserById as jest.Mock).mockResolvedValue({ id: "u1", stripeSubscriptionId: "subOld" });
    const { POST } = await import("../src/api/subscription/change/route");
    const res = await POST(makeReq({ userId: "u1", priceId: "p1", planId: "plan1" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Plan not found" });
  });

  test("returns 500 on stripe error", async () => {
    (readShop as jest.Mock).mockResolvedValue(SHOP);
    (getUserById as jest.Mock).mockResolvedValue({ id: "u1", stripeSubscriptionId: "subOld" });
    (stripe.subscriptions.update as jest.Mock).mockRejectedValue(new Error("boom"));
    const { POST } = await import("../src/api/subscription/change/route");
    const res = await POST(makeReq({ userId: "u1", priceId: "p1", planId: "plan1" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
    expect(setStripeSubscriptionId).not.toHaveBeenCalled();
  });
});
