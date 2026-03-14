/**
 * TC-09: Checkout reconciliation API tests
 */

import { POST } from "../resolve/route";
import { GET } from "../route";

jest.mock("@acme/platform-core/db", () => ({
  prisma: {},
}));
jest.mock("../../../lib/auth/pmLog", () => ({
  pmLog: jest.fn(),
}));
jest.mock("../../../lib/auth/session", () => ({
  hasPmSession: jest.fn(),
}));
jest.mock("../../../lib/orders/maskEmail", () => ({
  maskEmail: jest.fn((email: string | null) => (email ? `m***@masked.com` : null)),
}));

const { prisma } = require("@acme/platform-core/db"); // jest hoisting pattern
const { hasPmSession } = require("../../../lib/auth/session") as { hasPmSession: jest.Mock }; // jest hoisting pattern

const prismaAny = prisma as any; // PM-0004 Prisma client type varies

// A stale order: created 20 minutes ago
const STALE_CREATED = new Date(Date.now() - 20 * 60 * 1000);

function makeStaleOrder(overrides: Partial<{
  id: string; shopId: string; provider: string; amountCents: number;
  currency: string; customerEmail: string | null; createdAt: Date;
}> = {}) {
  return {
    id: "idem-stale-001",
    shopId: "caryina",
    provider: "stripe",
    amountCents: 4900,
    currency: "EUR",
    customerEmail: "buyer@example.com",
    createdAt: STALE_CREATED,
    ...overrides,
  };
}

function makeRequest(search = "", body?: unknown): Request {
  if (body !== undefined) {
    return new Request(`http://localhost/api/reconciliation/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  return new Request(`http://localhost/api/reconciliation${search}`);
}

beforeEach(() => {
  (hasPmSession as jest.Mock).mockResolvedValue(true);
  prismaAny.order = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({}),
  };
});

describe("GET /api/reconciliation", () => {
  it("returns 401 when session is invalid", async () => {
    (hasPmSession as jest.Mock).mockResolvedValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("TC-09-01: returns stale pending orders (status=pending AND createdAt < now-15min)", async () => {
    const staleOrder = makeStaleOrder();
    prismaAny.order.findMany.mockResolvedValue([staleOrder]);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.staleOrders).toHaveLength(1);
    expect(body.staleOrders[0].id).toBe("idem-stale-001");
    expect(body.staleOrders[0].elapsedMinutes).toBeGreaterThanOrEqual(15);

    const call = prismaAny.order.findMany.mock.calls[0][0];
    expect(call.where.status).toBe("pending");
    expect(call.where.createdAt.lt).toBeInstanceOf(Date);
  });

  it("filters by shop when shop param provided", async () => {
    prismaAny.order.findMany.mockResolvedValue([makeStaleOrder()]);
    await GET(makeRequest("?shop=caryina"));
    const call = prismaAny.order.findMany.mock.calls[0][0];
    expect(call.where.shopId).toBe("caryina");
  });

  it("returns empty list when no stale orders", async () => {
    prismaAny.order.findMany.mockResolvedValue([]);
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.staleOrders).toHaveLength(0);
  });
});

describe("POST /api/reconciliation/resolve", () => {
  it("returns 401 when session is invalid", async () => {
    (hasPmSession as jest.Mock).mockResolvedValue(false);
    const res = await POST(makeRequest("", { orderId: "idem-001" }));
    expect(res.status).toBe(401);
  });

  it("TC-09-02: marks order as resolved and returns ok:true", async () => {
    prismaAny.order.findUnique.mockResolvedValue({
      id: "idem-001",
      status: "pending",
      shopId: "caryina",
    });

    const res = await POST(makeRequest("", { orderId: "idem-001" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);

    expect(prismaAny.order.update).toHaveBeenCalledWith({
      where: { id: "idem-001" },
      data: { status: "resolved" },
    });
  });

  it("is idempotent: already-resolved order returns ok:true without re-writing", async () => {
    prismaAny.order.findUnique.mockResolvedValue({
      id: "idem-001",
      status: "resolved",
      shopId: "caryina",
    });

    const res = await POST(makeRequest("", { orderId: "idem-001" }));
    expect(res.status).toBe(200);
    expect(prismaAny.order.update).not.toHaveBeenCalled();
  });

  it("returns 404 when order not found", async () => {
    prismaAny.order.findUnique.mockResolvedValue(null);
    const res = await POST(makeRequest("", { orderId: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when orderId missing", async () => {
    const res = await POST(makeRequest("", {}));
    expect(res.status).toBe(400);
  });
});
