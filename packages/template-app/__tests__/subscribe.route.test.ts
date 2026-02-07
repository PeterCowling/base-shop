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
      create: jest.fn(),
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

const SHOP = { subscriptionsEnabled: true, billingProvider: "stripe" };

describe("/api/subscribe POST", () => {
  test("creates new subscription", async () => {
    (readShop as jest.Mock).mockResolvedValue(SHOP);
    (getUserById as jest.Mock).mockResolvedValue({ id: "u1" });
    (stripe.subscriptions.create as jest.Mock).mockResolvedValue({ id: "sub1", status: "active" });

    const { POST } = await import("../src/api/subscribe/route");
    const res = await POST({ json: async () => ({ userId: "u1", priceId: "p1" }) } as unknown as NextRequest);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "sub1", status: "active" });
    expect(stripe.subscriptions.create).toHaveBeenCalledWith({
      customer: "u1",
      items: [{ price: "p1" }],
      proration_behavior: "create_prorations",
      metadata: { userId: "u1", shop: "bcd" },
    });
    expect(setStripeSubscriptionId).toHaveBeenCalledWith("u1", "sub1", "bcd");
    const createOrder = (stripe.subscriptions.create as jest.Mock).mock.invocationCallOrder[0];
    const setOrder = (setStripeSubscriptionId as jest.Mock).mock.invocationCallOrder[0];
    expect(createOrder).toBeLessThan(setOrder);
  });

  test("updates existing subscription", async () => {
    (readShop as jest.Mock).mockResolvedValue(SHOP);
    (getUserById as jest.Mock).mockResolvedValue({ id: "u1", stripeSubscriptionId: "subOld" });
    (stripe.subscriptions.update as jest.Mock).mockResolvedValue({ id: "subOld", status: "active" });

    const { POST } = await import("../src/api/subscribe/route");
    const res = await POST({ json: async () => ({ userId: "u1", priceId: "p1" }) } as unknown as NextRequest);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "subOld", status: "active" });
    expect(stripe.subscriptions.update).toHaveBeenCalledWith("subOld", {
      items: [{ price: "p1" }],
      proration_behavior: "create_prorations",
    });
    expect(setStripeSubscriptionId).toHaveBeenCalledWith("u1", "subOld", "bcd");
    const updateOrder = (stripe.subscriptions.update as jest.Mock).mock.invocationCallOrder[0];
    const setOrder = (setStripeSubscriptionId as jest.Mock).mock.invocationCallOrder[0];
    expect(updateOrder).toBeLessThan(setOrder);
  });

  test("returns 400 on missing params", async () => {
    (readShop as jest.Mock).mockResolvedValue(SHOP);
    const { POST } = await import("../src/api/subscribe/route");
    const res = await POST({ json: async () => ({}) } as unknown as NextRequest);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing parameters" });
  });

  test("returns 403 when subscriptions disabled", async () => {
    (readShop as jest.Mock).mockResolvedValue({ subscriptionsEnabled: false });
    const { POST } = await import("../src/api/subscribe/route");
    const res = await POST({ json: async () => ({ userId: "u1", priceId: "p1" }) } as unknown as NextRequest);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Subscriptions disabled" });
  });

  test("returns 400 when billing provider missing", async () => {
    (readShop as jest.Mock).mockResolvedValue({ subscriptionsEnabled: true, billingProvider: "other" });
    const { POST } = await import("../src/api/subscribe/route");
    const res = await POST({ json: async () => ({ userId: "u1", priceId: "p1" }) } as unknown as NextRequest);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Billing not enabled" });
  });

  test("returns 404 when user not found", async () => {
    (readShop as jest.Mock).mockResolvedValue(SHOP);
    (getUserById as jest.Mock).mockResolvedValue(undefined);
    const { POST } = await import("../src/api/subscribe/route");
    const res = await POST({ json: async () => ({ userId: "u1", priceId: "p1" }) } as unknown as NextRequest);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "User not found" });
  });

  test("returns 500 on stripe error", async () => {
    (readShop as jest.Mock).mockResolvedValue(SHOP);
    (getUserById as jest.Mock).mockResolvedValue({ id: "u1" });
    (stripe.subscriptions.create as jest.Mock).mockRejectedValue(new Error("boom"));
    const { POST } = await import("../src/api/subscribe/route");
    const res = await POST({ json: async () => ({ userId: "u1", priceId: "p1" }) } as unknown as NextRequest);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
    expect(setStripeSubscriptionId).not.toHaveBeenCalled();
  });
});

