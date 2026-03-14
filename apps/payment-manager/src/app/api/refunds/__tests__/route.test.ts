/**
 * TC-05: Refund API tests (PM side)
 */

import { POST } from "../route";

jest.mock("@acme/platform-core/db", () => ({
  prisma: {},
}));
jest.mock("../../../lib/auth/pmLog", () => ({
  pmLog: jest.fn(),
}));
jest.mock("../../../lib/auth/session", () => ({
  hasPmSession: jest.fn(),
}));
// Mock @acme/stripe singleton
jest.mock("@acme/stripe", () => ({
  stripe: {
    refunds: {
      create: jest.fn(),
    },
  },
}));

const { prisma } = require("@acme/platform-core/db"); // jest hoisting pattern
const { hasPmSession } = require("../../../lib/auth/session") as { hasPmSession: jest.Mock }; // jest hoisting pattern
const { stripe } = require("@acme/stripe") as { stripe: { refunds: { create: jest.Mock } } }; // jest hoisting pattern

const prismaAny = prisma as any; // PM-0004 Prisma client type varies

// Seed env vars
const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  (hasPmSession as jest.Mock).mockResolvedValue(true);

  prismaAny.order = {
    findUnique: jest.fn().mockResolvedValue(null),
  };
  prismaAny.refund = {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: "ref_001" }),
  };

  stripe.refunds.create.mockResolvedValue({ id: "re_stripe_001", status: "succeeded" });

  process.env.CARYINA_BASE_URL = "http://caryina-mock:3001";
  process.env.CARYINA_INTERNAL_TOKEN = "test-internal-token-32chars-xxxxx";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.restoreAllMocks();
});

function makeRequest(body?: unknown): Request {
  return new Request("http://localhost/api/refunds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

function makeCompletedOrder(overrides: Partial<{
  id: string; shopId: string; provider: string; status: string;
  amountCents: number; currency: string; providerOrderId: string | null;
}> = {}) {
  return {
    id: "order_001",
    shopId: "caryina",
    provider: "stripe",
    status: "completed",
    amountCents: 9000,
    currency: "EUR",
    providerOrderId: "pi_stripe_001",
    ...overrides,
  };
}

describe("POST /api/refunds", () => {
  it("returns 401 when session is invalid", async () => {
    (hasPmSession as jest.Mock).mockResolvedValue(false);
    const res = await POST(makeRequest({ orderId: "order_001", amountCents: 1000 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when orderId missing", async () => {
    const res = await POST(makeRequest({ amountCents: 1000 }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when order not found", async () => {
    prismaAny.order.findUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ orderId: "nonexistent", amountCents: 1000 }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when order is not completed", async () => {
    prismaAny.order.findUnique.mockResolvedValue(makeCompletedOrder({ status: "pending" }));
    const res = await POST(makeRequest({ orderId: "order_001", amountCents: 1000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("pending");
  });

  it("TC-05-04: returns 400 when refund exceeds available amount", async () => {
    prismaAny.order.findUnique.mockResolvedValue(makeCompletedOrder({ amountCents: 5000 }));
    prismaAny.refund.findMany.mockResolvedValue([{ amountCents: 3000 }]);

    // 3000 already + 3000 new = 6000 > 5000
    const res = await POST(makeRequest({ orderId: "order_001", amountCents: 3000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/exceeds/i);
  });

  describe("Stripe path", () => {
    it("TC-05-01: Stripe happy path — returns 200 { ok: true, refundId }", async () => {
      prismaAny.order.findUnique.mockResolvedValue(makeCompletedOrder({
        provider: "stripe",
        providerOrderId: "pi_stripe_001",
        amountCents: 9000,
      }));

      const res = await POST(makeRequest({ orderId: "order_001", amountCents: 4500 }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.refundId).toBe("re_stripe_001");

      // Stripe was called with correct params
      expect(stripe.refunds.create).toHaveBeenCalledWith(expect.objectContaining({
        payment_intent: "pi_stripe_001",
        amount: 4500,
      }));

      // Refund row written
      expect(prismaAny.refund.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          provider: "stripe",
          amountCents: 4500,
          status: "succeeded",
          providerRefundId: "re_stripe_001",
        }),
      }));
    });

    it("returns 503 when Stripe throws", async () => {
      prismaAny.order.findUnique.mockResolvedValue(makeCompletedOrder());
      stripe.refunds.create.mockRejectedValue(new Error("Stripe down"));

      const res = await POST(makeRequest({ orderId: "order_001", amountCents: 1000 }));
      expect(res.status).toBe(503);
    });
  });

  describe("Axerve path", () => {
    it("TC-05-02: Axerve proxy happy path — calls Caryina with token and returns { ok: true }", async () => {
      prismaAny.order.findUnique.mockResolvedValue(makeCompletedOrder({
        provider: "axerve",
        providerOrderId: "shop-txn-001",
      }));

      // Mock fetch to Caryina internal route
      jest.spyOn(global, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ ok: true, transactionId: "axerve-txn-001" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const res = await POST(makeRequest({ orderId: "order_001", amountCents: 4500 }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ok).toBe(true);

      // Verify Caryina was called with correct token
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain("/api/internal/axerve-refund");
      expect((fetchCall[1] as RequestInit).headers as Record<string, string>)["x-internal-token"]
        = "test-internal-token-32chars-xxxxx";

      // Refund row written
      expect(prismaAny.refund.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          provider: "axerve",
          status: "succeeded",
        }),
      }));
    });

    it("TC-05-03: Caryina returns 500 → PM returns 503 { ok: false, error: 'Payment service unavailable' }", async () => {
      prismaAny.order.findUnique.mockResolvedValue(makeCompletedOrder({ provider: "axerve" }));

      jest.spyOn(global, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ ok: false, error: "internal error" }), {
          status: 500,
        }),
      );

      const res = await POST(makeRequest({ orderId: "order_001", amountCents: 1000 }));
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toMatch(/unavailable/i);
    });

    it("returns 503 when Caryina is unreachable (fetch throws)", async () => {
      prismaAny.order.findUnique.mockResolvedValue(makeCompletedOrder({ provider: "axerve" }));

      jest.spyOn(global, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

      const res = await POST(makeRequest({ orderId: "order_001", amountCents: 1000 }));
      expect(res.status).toBe(503);
    });
  });
});
