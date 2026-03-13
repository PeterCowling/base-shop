import { GET } from "../route";

// Mock @opennextjs/cloudflare (ESM-only — not compatible with Jest CommonJS transform).
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: jest.fn().mockResolvedValue({ env: {} }),
}));

// Mock Prisma client.
jest.mock("@acme/platform-core/db", () => ({
  prisma: {},
}));

// Mock pmLog to suppress output.
jest.mock("../../../../lib/auth/pmLog", () => ({
  pmLog: jest.fn(),
}));

// Mock session auth.
jest.mock("../../../../lib/auth/session", () => ({
  hasPmSession: jest.fn().mockResolvedValue(true),
  timingSafeEqual: jest.fn().mockReturnValue(true),
}));

const { prisma } = require("@acme/platform-core/db") as { prisma: Record<string, unknown> };

const SESSION_SECRET = "test-session-secret-32-chars-minimum!";

const ORIGINAL_ENV: Record<string, string | undefined> = {
  NODE_ENV: process.env.NODE_ENV,
  PAYMENT_MANAGER_SESSION_SECRET: process.env.PAYMENT_MANAGER_SESSION_SECRET,
};

beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.PAYMENT_MANAGER_SESSION_SECRET = SESSION_SECRET;
  // Reset prisma mock surfaces
  delete (prisma as Record<string, unknown>).order;
});

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

function makeOrderRows(count: number, overrides: Partial<Record<string, unknown>> = []) {
  return Array.from({ length: count }, (_, i) => ({
    id: `order-${i}`,
    shopId: "caryina",
    provider: "stripe",
    status: "completed",
    amountCents: 4900,
    currency: "EUR",
    customerEmail: `user${i}@example.com`,
    providerOrderId: `pi_${i}`,
    createdAt: new Date("2026-01-01T12:00:00Z"),
    updatedAt: new Date("2026-01-01T12:00:00Z"),
    ...(Array.isArray(overrides) ? {} : overrides),
  }));
}

// TC-04-01: GET /api/orders returns 50 items max with nextCursor
describe("TC-04-01: pagination", () => {
  it("returns up to 50 orders and a nextCursor when more exist", async () => {
    // Return 51 rows — indicates next page exists
    const rows = makeOrderRows(51);
    (prisma as Record<string, unknown>).order = {
      findMany: jest.fn().mockResolvedValue(rows),
    };

    const req = new Request("https://pm.example/api/orders");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = (await res.json()) as { orders: unknown[]; nextCursor: string | null };
    expect(data.orders).toHaveLength(50);
    expect(data.nextCursor).toBeTruthy();
  });

  it("returns null nextCursor when no more pages", async () => {
    const rows = makeOrderRows(10);
    (prisma as Record<string, unknown>).order = {
      findMany: jest.fn().mockResolvedValue(rows),
    };

    const req = new Request("https://pm.example/api/orders");
    const res = await GET(req);
    const data = (await res.json()) as { nextCursor: string | null };
    expect(data.nextCursor).toBeNull();
  });
});

// TC-04-04: customer email is masked by default
describe("TC-04-04: email masking", () => {
  it("masks customer email by default (j***@example.com)", async () => {
    const rows = makeOrderRows(1, { customerEmail: "jane@example.com" });
    (prisma as Record<string, unknown>).order = {
      findMany: jest.fn().mockResolvedValue(rows),
    };

    const req = new Request("https://pm.example/api/orders");
    const res = await GET(req);
    const data = (await res.json()) as { orders: Array<{ customerEmail: string }> };
    expect(data.orders[0]!.customerEmail).toBe("j***@example.com");
  });

  it("returns unmasked email when unmask=1 is set", async () => {
    const rows = makeOrderRows(1, { customerEmail: "jane@example.com" });
    (prisma as Record<string, unknown>).order = {
      findMany: jest.fn().mockResolvedValue(rows),
    };

    const req = new Request("https://pm.example/api/orders?unmask=1");
    const res = await GET(req);
    const data = (await res.json()) as { orders: Array<{ customerEmail: string }> };
    expect(data.orders[0]!.customerEmail).toBe("jane@example.com");
  });
});

// TC-04-05: filter by shop
describe("TC-04-05: filter by shop", () => {
  it("passes shopId filter to Prisma where clause", async () => {
    const findMany = jest.fn().mockResolvedValue(makeOrderRows(2, { shopId: "caryina" }));
    (prisma as Record<string, unknown>).order = { findMany };

    const req = new Request("https://pm.example/api/orders?shop=caryina");
    await GET(req);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ shopId: "caryina" }),
      }),
    );
  });
});

// Authentication guard
describe("authentication", () => {
  it("returns 401 when session is invalid", async () => {
    const { hasPmSession } = jest.requireMock("../../../../lib/auth/session") as {
      hasPmSession: jest.Mock;
    };
    hasPmSession.mockResolvedValueOnce(false);

    const req = new Request("https://pm.example/api/orders");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
