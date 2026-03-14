/**
 * TC-10: Analytics summary API tests
 */

import { GET } from "../route";

jest.mock("@acme/platform-core/db", () => ({
  prisma: {},
}));
jest.mock("../../../../../lib/auth/pmLog", () => ({
  pmLog: jest.fn(),
}));
jest.mock("../../../../../lib/auth/session", () => ({
  hasPmSession: jest.fn(),
}));

const { prisma } = require("@acme/platform-core/db"); // jest hoisting pattern
const { hasPmSession } = require("../../../../../lib/auth/session") as { hasPmSession: jest.Mock }; // jest hoisting pattern

const prismaAny = prisma as any; // PM-0004 Prisma client type varies

// Fixed "now" for deterministic date filtering
const NOW = new Date("2026-03-13T12:00:00.000Z");
const RECENT = new Date("2026-03-10T10:00:00.000Z"); // within last 30 days

function makeRequest(search = ""): Request {
  return new Request(`http://localhost/api/analytics/summary${search}`);
}

function makeOrder(
  overrides: Partial<{ status: string; amountCents: number; provider: string; shopId: string }> = {},
) {
  return {
    status: "completed",
    amountCents: 5000,
    provider: "stripe",
    shopId: "caryina",
    ...overrides,
  };
}

function makeRefund(
  overrides: Partial<{ status: string; amountCents: number; shopId: string }> = {},
) {
  return {
    status: "succeeded",
    amountCents: 2000,
    shopId: "caryina",
    ...overrides,
  };
}

beforeEach(() => {
  (hasPmSession as jest.Mock).mockResolvedValue(true);
  prismaAny.order = {
    findMany: jest.fn().mockResolvedValue([]),
  };
  prismaAny.refund = {
    findMany: jest.fn().mockResolvedValue([]),
  };
});

describe("GET /api/analytics/summary", () => {
  it("returns 401 when session is invalid", async () => {
    (hasPmSession as jest.Mock).mockResolvedValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("TC-10-01: returns correct revenue sum and counts from seeded orders", async () => {
    prismaAny.order.findMany.mockResolvedValue([
      makeOrder({ status: "completed", amountCents: 4900, provider: "stripe" }),
      makeOrder({ status: "completed", amountCents: 2500, provider: "axerve" }),
      makeOrder({ status: "failed", amountCents: 1000, provider: "stripe" }),
    ]);
    prismaAny.refund.findMany.mockResolvedValue([
      makeRefund({ status: "succeeded", amountCents: 1500 }),
    ]);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    // Revenue = sum of completed only
    expect(body.revenueCents).toBe(4900 + 2500);
    expect(body.orderCount).toBe(3);
    expect(body.completedCount).toBe(2);
    expect(body.failedCount).toBe(1);
    // failureRate = 1/3 * 100 ≈ 33.3%
    expect(body.failureRatePct).toBeCloseTo(33.3, 0);
    expect(body.refundCount).toBe(1);
    expect(body.refundAmountCents).toBe(1500);
    // refundRate = 1/2 * 100 = 50%
    expect(body.refundRatePct).toBe(50);
    expect(body.providerSplit.stripe).toBe(1);
    expect(body.providerSplit.axerve).toBe(1);
  });

  it("TC-10-02: filter by shop passes shopId to Prisma where clause", async () => {
    prismaAny.order.findMany.mockResolvedValue([
      makeOrder({ shopId: "caryina", amountCents: 3000 }),
    ]);
    prismaAny.refund.findMany.mockResolvedValue([]);

    await GET(makeRequest("?shop=caryina"));

    const orderCall = prismaAny.order.findMany.mock.calls[0][0];
    expect(orderCall.where.shopId).toBe("caryina");
    const refundCall = prismaAny.refund.findMany.mock.calls[0][0];
    expect(refundCall.where.shopId).toBe("caryina");
  });

  it("returns zeros for all metrics when no data exists", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.revenueCents).toBe(0);
    expect(body.orderCount).toBe(0);
    expect(body.completedCount).toBe(0);
    expect(body.failedCount).toBe(0);
    expect(body.failureRatePct).toBe(0);
    expect(body.refundCount).toBe(0);
    expect(body.refundAmountCents).toBe(0);
    expect(body.refundRatePct).toBe(0);
    expect(body.providerSplit).toEqual({ stripe: 0, axerve: 0 });
  });

  it("default date range applies createdAt.gte and .lte to where clause", async () => {
    await GET(makeRequest());

    const call = prismaAny.order.findMany.mock.calls[0][0];
    expect(call.where.createdAt.gte).toBeInstanceOf(Date);
    expect(call.where.createdAt.lte).toBeInstanceOf(Date);
    // gte should be ~30 days before lte
    const diffMs = call.where.createdAt.lte.getTime() - call.where.createdAt.gte.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(30, 0);
  });

  it("returns 500 on Prisma error", async () => {
    prismaAny.order.findMany.mockRejectedValue(new Error("DB down"));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
