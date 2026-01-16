import { jest } from "@jest/globals";
import type { NextRequest } from "next/server";

afterEach(() => {
  jest.clearAllMocks();
});

jest.mock("@acme/stripe", () => ({
  stripe: {
    subscriptions: {
      del: jest.fn(),
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

import { stripe } from "@acme/stripe";
import { readShop } from "@acme/platform-core/repositories/shops.server";
import { getUserById, setStripeSubscriptionId } from "@acme/platform-core/repositories/users";

const SHOP = {
  subscriptionsEnabled: true,
  billingProvider: "stripe",
};

const makeReq = (body: unknown) =>
  ({
    json: async () => body,
    nextUrl: { searchParams: new URLSearchParams([["shop", "bcd"]]) },
  }) as unknown as NextRequest;

describe("/api/subscription/cancel POST", () => {
  test("deletes subscription and clears id", async () => {
    (readShop as jest.Mock).mockResolvedValue(SHOP);
    (getUserById as jest.Mock).mockResolvedValue({ id: "u1", stripeSubscriptionId: "sub1" });
    (stripe.subscriptions.del as jest.Mock).mockResolvedValue({ id: "sub1", status: "canceled" });

    const { POST } = await import("../src/api/subscription/cancel/route");
    const res = await POST(makeReq({ userId: "u1" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "sub1", status: "canceled" });
    expect(stripe.subscriptions.del).toHaveBeenCalledWith("sub1");
    expect(setStripeSubscriptionId).toHaveBeenCalledWith("u1", null, "bcd");
    const delOrder = (stripe.subscriptions.del as jest.Mock).mock.invocationCallOrder[0];
    const setOrder = (setStripeSubscriptionId as jest.Mock).mock.invocationCallOrder[0];
    expect(delOrder).toBeLessThan(setOrder);
  });

  test("returns 400 on missing params", async () => {
    const { POST } = await import("../src/api/subscription/cancel/route");
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing parameters" });
  });

  test("returns 403 when subscriptions disabled", async () => {
    (readShop as jest.Mock).mockResolvedValue({ subscriptionsEnabled: false });
    const { POST } = await import("../src/api/subscription/cancel/route");
    const res = await POST(makeReq({ userId: "u1" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Subscriptions disabled" });
  });

  test("returns 400 when billing provider missing", async () => {
    (readShop as jest.Mock).mockResolvedValue({ subscriptionsEnabled: true, billingProvider: "other" });
    const { POST } = await import("../src/api/subscription/cancel/route");
    const res = await POST(makeReq({ userId: "u1" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Billing not enabled" });
  });

  test("returns 404 when subscription not found", async () => {
    (readShop as jest.Mock).mockResolvedValue(SHOP);
    (getUserById as jest.Mock).mockResolvedValue({ id: "u1" });
    const { POST } = await import("../src/api/subscription/cancel/route");
    const res = await POST(makeReq({ userId: "u1" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Subscription not found" });
  });

  test("returns 500 on stripe error", async () => {
    (readShop as jest.Mock).mockResolvedValue(SHOP);
    (getUserById as jest.Mock).mockResolvedValue({ id: "u1", stripeSubscriptionId: "sub1" });
    (stripe.subscriptions.del as jest.Mock).mockRejectedValue(new Error("boom"));
    const { POST } = await import("../src/api/subscription/cancel/route");
    const res = await POST(makeReq({ userId: "u1" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
    expect(setStripeSubscriptionId).not.toHaveBeenCalled();
  });
});
