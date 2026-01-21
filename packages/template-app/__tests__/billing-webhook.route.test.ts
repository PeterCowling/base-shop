import type { NextRequest } from "next/server";
import { jest } from "@jest/globals";

import { readShop } from "@acme/platform-core/repositories/shops.server";
import { setStripeSubscriptionId } from "@acme/platform-core/repositories/users";
import { stripe } from "@acme/stripe";

// Ensure Response.json exists for NextResponse
const ResponseWithJson = Response as unknown as typeof Response & {
  json?: (data: unknown, init?: ResponseInit) => Response;
};
if (typeof ResponseWithJson.json !== "function") {
  ResponseWithJson.json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

jest.mock("@acme/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: jest.fn() },
  },
}));

jest.mock("@acme/platform-core/repositories/shops.server", () => ({
  readShop: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/users", () => ({
  setStripeSubscriptionId: jest.fn(),
}));

const makeReq = (body: unknown) =>
  ({
    text: async () => JSON.stringify(body),
    headers: { get: () => "sig" } as Headers,
  }) as unknown as NextRequest;

describe("/api/billing/webhook POST", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 when billing not enabled", async () => {
    (readShop as jest.Mock).mockResolvedValue({ billingProvider: "other" });
    const { POST } = await import("../src/api/billing/webhook/route");
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Billing not enabled" });
  });

  test("returns 400 on invalid signature", async () => {
    (readShop as jest.Mock).mockResolvedValue({ billingProvider: "stripe" });
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error("bad sig");
    });
    const { POST } = await import("../src/api/billing/webhook/route");
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Invalid signature");
  });

  test("handles subscription deleted", async () => {
    (readShop as jest.Mock).mockResolvedValue({ billingProvider: "stripe" });
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: { metadata: { userId: "u1" } } },
    });
    const { POST } = await import("../src/api/billing/webhook/route");
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    expect(setStripeSubscriptionId).toHaveBeenCalledWith("u1", null, "bcd");
    expect(await res.json()).toEqual({ received: true });
  });

  test("handles subscription created", async () => {
    (readShop as jest.Mock).mockResolvedValue({ billingProvider: "stripe" });
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: "customer.subscription.created",
      data: { object: { id: "sub123", metadata: { userId: "u1" } } },
    });
    const { POST } = await import("../src/api/billing/webhook/route");
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    expect(setStripeSubscriptionId).toHaveBeenCalledWith("u1", "sub123", "bcd");
    expect(await res.json()).toEqual({ received: true });
  });

  test("ignores other events", async () => {
    (readShop as jest.Mock).mockResolvedValue({ billingProvider: "stripe" });
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: "invoice.paid",
      data: { object: {} },
    });
    const { POST } = await import("../src/api/billing/webhook/route");
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    expect(setStripeSubscriptionId).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({ received: true });
  });
});

