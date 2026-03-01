// apps/caryina/src/app/admin/api/refunds/route.test.ts
// Tests for POST /admin/api/refunds (TC-04-01 through TC-04-07).

import { POST } from "@/app/admin/api/refunds/route";

jest.mock("@acme/axerve", () => {
  class MockAxerveError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AxerveError";
    }
  }
  return {
    callRefund: jest.fn(),
    AxerveError: MockAxerveError,
  };
});

const mockAxerve = jest.requireMock("@acme/axerve") as {
  callRefund: jest.Mock;
  AxerveError: new (message: string) => Error;
};
const { callRefund } = mockAxerve;
const MockAxerveError = mockAxerve.AxerveError;

const makeReq = (body?: unknown) =>
  new Request("http://localhost/admin/api/refunds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

describe("POST /admin/api/refunds", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      AXERVE_SHOP_LOGIN: "TEST_SHOP",
      AXERVE_API_KEY: "TEST_API_KEY",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // TC-04-01: Happy path — shopTransactionId provided, callRefund succeeds.
  it("TC-04-01: valid shopTransactionId + amountCents → 200 with data", async () => {
    callRefund.mockResolvedValue({
      success: true,
      transactionId: "test-refund-txn-001",
      bankTransactionId: "bank-refund-001",
    });

    const res = await POST(
      makeReq({ shopTransactionId: "test-refund-txn-001", amountCents: 4500 }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      data: { transactionId: "test-refund-txn-001", bankTransactionId: "bank-refund-001" },
    });
    expect(callRefund).toHaveBeenCalledWith(
      expect.objectContaining({ shopTransactionId: "test-refund-txn-001", amount: "45.00" }),
    );
  });

  // TC-04-02: Happy path — bankTransactionId provided, callRefund succeeds.
  it("TC-04-02: valid bankTransactionId + amountCents → 200 with data", async () => {
    callRefund.mockResolvedValue({
      success: true,
      transactionId: "bank-001",
      bankTransactionId: "bank-001",
    });

    const res = await POST(
      makeReq({ bankTransactionId: "bank-001", amountCents: 1000 }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(callRefund).toHaveBeenCalledWith(
      expect.objectContaining({ bankTransactionId: "bank-001", amount: "10.00" }),
    );
  });

  // TC-04-03: No transaction ID provided → 400 validation_error.
  it("TC-04-03: body missing both transaction IDs → 400 validation_error", async () => {
    const res = await POST(makeReq({ amountCents: 4500 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ ok: false, error: "validation_error" });
    expect(callRefund).not.toHaveBeenCalled();
  });

  // TC-04-04: amountCents=0 → 400 validation_error (must be positive integer).
  it("TC-04-04: amountCents=0 → 400 validation_error", async () => {
    const res = await POST(
      makeReq({ shopTransactionId: "test-refund-txn-001", amountCents: 0 }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ ok: false, error: "validation_error" });
    expect(callRefund).not.toHaveBeenCalled();
  });

  // TC-04-05: callRefund returns success:false → 402 with errorDescription.
  it("TC-04-05: callRefund KO → 402 with error and errorCode", async () => {
    callRefund.mockResolvedValue({
      success: false,
      transactionId: "test-refund-txn-001",
      bankTransactionId: "",
      errorCode: "10",
      errorDescription: "Refund declined by issuer",
    });

    const res = await POST(
      makeReq({ shopTransactionId: "test-refund-txn-001", amountCents: 4500 }),
    );
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body).toMatchObject({
      ok: false,
      error: "Refund declined by issuer",
      errorCode: "10",
    });
  });

  // TC-04-06: callRefund throws AxerveError → 502 payment service unavailable.
  it("TC-04-06: callRefund throws AxerveError → 502", async () => {
    callRefund.mockRejectedValue(new MockAxerveError("SOAP connection refused"));

    const res = await POST(
      makeReq({ shopTransactionId: "test-refund-txn-001", amountCents: 4500 }),
    );
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body).toMatchObject({ ok: false, error: "Payment service unavailable" });
  });

  // TC-04-07: Missing env var → 503 before calling Axerve.
  it("TC-04-07: missing AXERVE_SHOP_LOGIN → 503 without calling Axerve", async () => {
    delete process.env.AXERVE_SHOP_LOGIN;

    const res = await POST(
      makeReq({ shopTransactionId: "test-refund-txn-001", amountCents: 4500 }),
    );
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: "Payment service not configured" });
    expect(callRefund).not.toHaveBeenCalled();
  });
});
