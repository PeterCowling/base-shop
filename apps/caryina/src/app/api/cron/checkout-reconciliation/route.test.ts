import { NextRequest } from "next/server";

import { POST } from "@/app/api/cron/checkout-reconciliation/route";

jest.mock("@/lib/checkoutReconciliation.server", () => ({
  reconcileStaleCheckoutAttempts: jest.fn(),
}));

const { reconcileStaleCheckoutAttempts } = jest.requireMock(
  "@/lib/checkoutReconciliation.server",
) as {
  reconcileStaleCheckoutAttempts: jest.Mock;
};

const URL = "http://localhost/api/cron/checkout-reconciliation";

function makeReq(opts: {
  auth?: string;
  body?: Record<string, unknown>;
}): NextRequest {
  return new NextRequest(URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(opts.auth ? { authorization: opts.auth } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

describe("POST /api/cron/checkout-reconciliation", () => {
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
    const res = await POST(makeReq({}));
    expect(res.status).toBe(401);
    expect(reconcileStaleCheckoutAttempts).not.toHaveBeenCalled();
  });

  it("returns reconciliation summary when authorized", async () => {
    const res = await POST(
      makeReq({
        auth: "Bearer test-cron-secret",
        body: { staleMinutes: 10, maxAttempts: 5 },
      }),
    );
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

  it("returns reconciliation summary with no params (uses defaults)", async () => {
    const res = await POST(makeReq({ auth: "Bearer test-cron-secret" }));
    expect(res.status).toBe(200);
    expect(reconcileStaleCheckoutAttempts).toHaveBeenCalledWith({
      shopId: "caryina",
      staleMinutes: undefined,
      maxAttempts: undefined,
    });
  });

  it("returns 400 for invalid staleMinutes", async () => {
    const res = await POST(
      makeReq({
        auth: "Bearer test-cron-secret",
        body: { staleMinutes: "abc" },
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "staleMinutes must be a positive integer",
    });
    expect(reconcileStaleCheckoutAttempts).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid maxAttempts", async () => {
    const res = await POST(
      makeReq({
        auth: "Bearer test-cron-secret",
        body: { maxAttempts: 0 },
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "maxAttempts must be a positive integer",
    });
    expect(reconcileStaleCheckoutAttempts).not.toHaveBeenCalled();
  });
});
