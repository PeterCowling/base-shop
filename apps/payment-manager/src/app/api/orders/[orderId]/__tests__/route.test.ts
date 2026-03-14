import { GET } from "../route";

// Mock @opennextjs/cloudflare (ESM-only)
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: jest.fn().mockResolvedValue({ env: {} }),
}));

jest.mock("@acme/platform-core/db", () => ({
  prisma: {},
}));

jest.mock("../../../../../lib/auth/pmLog", () => ({
  pmLog: jest.fn(),
}));

jest.mock("../../../../../lib/auth/session", () => ({
  hasPmSession: jest.fn().mockResolvedValue(true),
  timingSafeEqual: jest.fn().mockReturnValue(true),
}));

const { prisma } = require("@acme/platform-core/db") as { prisma: Record<string, unknown> };

const SESSION_SECRET = "test-session-secret-32-chars-minimum!";

beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.PAYMENT_MANAGER_SESSION_SECRET = SESSION_SECRET;
  delete (prisma as Record<string, unknown>).order;
});

const SAMPLE_ORDER = {
  id: "order-abc123",
  shopId: "caryina",
  provider: "stripe",
  status: "completed",
  amountCents: 4900,
  currency: "EUR",
  customerEmail: "jane@example.com",
  providerOrderId: "pi_abc123",
  lineItemsJson: [{ productId: "prod-1", sku: "SKU-A", qty: 2, unitCents: 2450 }],
  createdAt: new Date("2026-01-01T12:00:00Z"),
  updatedAt: new Date("2026-01-01T12:05:00Z"),
  refunds: [
    {
      id: "ref-001",
      amountCents: 2450,
      currency: "EUR",
      status: "succeeded",
      providerRefundId: "re_abc",
      reason: "Customer request",
      createdAt: new Date("2026-01-02T10:00:00Z"),
    },
  ],
};

function makeRequest(orderId: string, params?: string): Request {
  return new Request(`https://pm.example/api/orders/${orderId}${params ? `?${params}` : ""}`);
}

// TC-04-03: GET /api/orders/:orderId returns full order with all fields
describe("TC-04-03: order detail", () => {
  it("returns full order object with refunds", async () => {
    (prisma as Record<string, unknown>).order = {
      findUnique: jest.fn().mockResolvedValue(SAMPLE_ORDER),
    };

    const res = await GET(makeRequest("order-abc123"), {
      params: Promise.resolve({ orderId: "order-abc123" }),
    });
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      order: {
        id: string;
        refunds: Array<{ id: string }>;
        customerEmail: string;
        lineItemsJson: unknown;
      };
    };
    expect(data.order.id).toBe("order-abc123");
    expect(data.order.refunds).toHaveLength(1);
    expect(data.order.refunds[0]!.id).toBe("ref-001");
    // Email should be masked by default
    expect(data.order.customerEmail).toBe("j***@example.com");
    expect(data.order.lineItemsJson).toBeDefined();
  });

  it("returns 404 when order does not exist", async () => {
    (prisma as Record<string, unknown>).order = {
      findUnique: jest.fn().mockResolvedValue(null),
    };

    const res = await GET(makeRequest("nonexistent"), {
      params: Promise.resolve({ orderId: "nonexistent" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns unmasked email when unmask=1", async () => {
    (prisma as Record<string, unknown>).order = {
      findUnique: jest.fn().mockResolvedValue(SAMPLE_ORDER),
    };

    const res = await GET(makeRequest("order-abc123", "unmask=1"), {
      params: Promise.resolve({ orderId: "order-abc123" }),
    });
    const data = (await res.json()) as { order: { customerEmail: string } };
    expect(data.order.customerEmail).toBe("jane@example.com");
  });
});

// Authentication guard
describe("authentication", () => {
  it("returns 401 when session is invalid", async () => {
    const { hasPmSession } = jest.requireMock("../../../../../lib/auth/session") as {
      hasPmSession: jest.Mock;
    };
    hasPmSession.mockResolvedValueOnce(false);

    const res = await GET(makeRequest("order-abc123"), {
      params: Promise.resolve({ orderId: "order-abc123" }),
    });
    expect(res.status).toBe(401);
  });
});
