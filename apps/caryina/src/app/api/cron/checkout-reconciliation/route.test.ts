import { NextRequest } from "next/server";

import { GET } from "@/app/api/cron/checkout-reconciliation/route";

jest.mock("@/lib/checkoutReconciliation.server", () => ({
  reconcileStaleCheckoutAttempts: jest.fn(),
}));

const { reconcileStaleCheckoutAttempts } = jest.requireMock(
  "@/lib/checkoutReconciliation.server",
) as {
  reconcileStaleCheckoutAttempts: jest.Mock;
};

describe("GET /api/cron/checkout-reconciliation", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    reconcileStaleCheckoutAttempts.mockResolvedValue({
      scanned: 2,
      released: 1,
      failedWithoutHold: 1,
      needsReview: 0,
      errors: 0,
    });
  });

  afterEach(() => {
    if (typeof originalSecret === "string") {
      process.env.CRON_SECRET = originalSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  it("returns 401 when auth header is missing", async () => {
    const req = new NextRequest("http://localhost/api/cron/checkout-reconciliation", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(reconcileStaleCheckoutAttempts).not.toHaveBeenCalled();
  });

  it("returns reconciliation summary when authorized", async () => {
    const req = new NextRequest(
      "http://localhost/api/cron/checkout-reconciliation?staleMinutes=10&maxAttempts=5",
      {
        method: "GET",
        headers: { authorization: "Bearer test-cron-secret" },
      },
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      summary: { scanned: number };
    };
    expect(body.ok).toBe(true);
    expect(body.summary.scanned).toBe(2);
    expect(reconcileStaleCheckoutAttempts).toHaveBeenCalledWith({
      shopId: "caryina",
      staleMinutes: 10,
      maxAttempts: 5,
    });
  });

  it("returns 400 for invalid staleMinutes", async () => {
    const req = new NextRequest(
      "http://localhost/api/cron/checkout-reconciliation?staleMinutes=abc",
      {
        method: "GET",
        headers: { authorization: "Bearer test-cron-secret" },
      },
    );

    const res = await GET(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "staleMinutes must be a positive integer",
    });
    expect(reconcileStaleCheckoutAttempts).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid maxAttempts", async () => {
    const req = new NextRequest(
      "http://localhost/api/cron/checkout-reconciliation?maxAttempts=0",
      {
        method: "GET",
        headers: { authorization: "Bearer test-cron-secret" },
      },
    );

    const res = await GET(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "maxAttempts must be a positive integer",
    });
    expect(reconcileStaleCheckoutAttempts).not.toHaveBeenCalled();
  });
});
