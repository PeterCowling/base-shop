/**
 * TC-05-05, TC-05-06: Caryina internal Axerve refund route tests
 */

import { POST } from "../route";

class MockAxerveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AxerveError";
  }
}

jest.mock("@acme/axerve", () => ({
  callRefund: jest.fn(),
  AxerveError: MockAxerveError,
}));

const { callRefund } = require("@acme/axerve") as { callRefund: jest.Mock }; // jest hoisting pattern

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  callRefund.mockResolvedValue({
    success: true,
    transactionId: "shop-txn-001",
    bankTransactionId: "bank-txn-001",
  });
  process.env.CARYINA_INTERNAL_TOKEN = "test-internal-token-32chars-xxxxx";
  process.env.AXERVE_SHOP_LOGIN = "test-shop-login";
  process.env.AXERVE_API_KEY = "test-api-key";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(body?: unknown, token?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // eslint-disable-next-line security/detect-possible-timing-attacks -- test helper, not production auth
  if (token !== undefined) headers["x-internal-token"] = token;
  return new Request("http://localhost/api/internal/axerve-refund", {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
  });
}

describe("POST /api/internal/axerve-refund", () => {
  it("TC-05-05: returns 401 when x-internal-token is missing", async () => {
    const res = await POST(makeRequest({ shopTransactionId: "txn-001", amountCents: 4500 }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is wrong", async () => {
    const res = await POST(
      makeRequest({ shopTransactionId: "txn-001", amountCents: 4500 }, "wrong-token"),
    );
    expect(res.status).toBe(401);
  });

  it("TC-05-06: valid token with shopTransactionId calls callRefund and returns ok:true", async () => {
    const res = await POST(
      makeRequest(
        { shopTransactionId: "txn-001", amountCents: 4500 },
        "test-internal-token-32chars-xxxxx",
      ),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.transactionId).toBe("shop-txn-001");

    // Verify callRefund was called with correct params
    expect(callRefund).toHaveBeenCalledWith(expect.objectContaining({
      shopLogin: "test-shop-login",
      apiKey: "test-api-key",
      shopTransactionId: "txn-001",
      amount: "45.00",
      uicCode: "978",
    }));
  });

  it("returns 400 when both transaction IDs are missing", async () => {
    const res = await POST(
      makeRequest({ amountCents: 4500 }, "test-internal-token-32chars-xxxxx"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when amountCents is missing or not a positive integer", async () => {
    const res = await POST(
      makeRequest({ shopTransactionId: "txn-001", amountCents: -100 }, "test-internal-token-32chars-xxxxx"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 503 when AXERVE env vars are missing", async () => {
    delete process.env.AXERVE_SHOP_LOGIN;
    const res = await POST(
      makeRequest({ shopTransactionId: "txn-001", amountCents: 4500 }, "test-internal-token-32chars-xxxxx"),
    );
    expect(res.status).toBe(503);
    expect(callRefund).not.toHaveBeenCalled();
  });

  it("returns 502 when callRefund throws AxerveError", async () => {
    callRefund.mockRejectedValue(new MockAxerveError("SOAP timeout"));

    const res = await POST(
      makeRequest({ shopTransactionId: "txn-001", amountCents: 4500 }, "test-internal-token-32chars-xxxxx"),
    );
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/unavailable/i);
  });

  it("propagates non-Axerve errors", async () => {
    callRefund.mockRejectedValue(new Error("unexpected"));

    await expect(
      POST(makeRequest({ shopTransactionId: "txn-001", amountCents: 4500 }, "test-internal-token-32chars-xxxxx")),
    ).rejects.toThrow("unexpected");
  });

  it("returns ok:false when Axerve declines the refund", async () => {
    callRefund.mockResolvedValue({
      success: false,
      transactionId: "",
      bankTransactionId: "",
      errorCode: "56",
      errorDescription: "Transaction not refundable",
    });

    const res = await POST(
      makeRequest({ shopTransactionId: "txn-001", amountCents: 4500 }, "test-internal-token-32chars-xxxxx"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Transaction not refundable");
    expect(body.errorCode).toBe("56");
  });
});
