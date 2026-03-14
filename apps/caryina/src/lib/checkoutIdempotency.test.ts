// TASK-07: Unit tests for Prisma idempotency store
// Mocks @acme/platform-core/db at module boundary — no real DB required.
// Uses the same jest.mock pattern as caryina checkout route tests.
// jest.mock() calls are hoisted by Jest — import order here is for ESLint compliance only.

import {
  beginCheckoutAttempt,
  beginStripeCheckoutFinalization,
  buildCheckoutRequestHash,
  listStaleInProgressCheckoutAttempts,
  markCheckoutAttemptPaymentAttempted,
  markCheckoutAttemptReservation,
  markCheckoutAttemptResult,
  recordCheckoutAttemptStripeSession,
} from "./checkoutIdempotency.server";

const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();
const mockUpdateMany = jest.fn();
const mockUpdate = jest.fn();
const mockTransaction = jest.fn();

jest.mock("@acme/platform-core/db", () => ({
  prisma: {
    checkoutAttempt: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

// server-only guard: hoisted by Jest at runtime
jest.mock("server-only", () => ({}));

const SHOP = "caryina";
const KEY = "idem-key-001";
const HASH = "abc123hash";

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  const now = new Date("2026-01-01T10:00:00Z");
  return {
    id: "cuid-1",
    shopId: SHOP,
    idempotencyKey: KEY,
    requestHash: HASH,
    status: "in_progress",
    acceptedLegalTerms: null,
    acceptedLegalTermsAt: null,
    provider: null,
    shopTransactionId: null,
    holdId: null,
    cartId: null,
    lang: null,
    buyerName: null,
    buyerEmail: null,
    paymentAttemptedAt: null,
    stripeSessionId: null,
    stripeSessionExpiresAt: null,
    stripePaymentIntentId: null,
    responseStatus: null,
    responseBody: null,
    errorCode: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// buildCheckoutRequestHash
// ---------------------------------------------------------------------------

describe("buildCheckoutRequestHash", () => {
  it("TC-13: same payload produces same hash", () => {
    const payload = { shopId: SHOP, items: [{ sku: "abc", qty: 1 }] };
    const h1 = buildCheckoutRequestHash(payload);
    const h2 = buildCheckoutRequestHash(payload);
    expect(h1).toBe(h2);
    expect(typeof h1).toBe("string");
    expect(h1.length).toBeGreaterThan(10);
  });

  it("different payloads produce different hashes", () => {
    const h1 = buildCheckoutRequestHash({ a: 1 });
    const h2 = buildCheckoutRequestHash({ a: 2 });
    expect(h1).not.toBe(h2);
  });
});

// ---------------------------------------------------------------------------
// beginCheckoutAttempt
// ---------------------------------------------------------------------------

describe("beginCheckoutAttempt", () => {
  it("TC-01: new record → acquired with status in_progress", async () => {
    const row = makeRow();
    mockCreate.mockResolvedValueOnce(row);

    const result = await beginCheckoutAttempt({ shopId: SHOP, idempotencyKey: KEY, requestHash: HASH });

    expect(result.kind).toBe("acquired");
    expect(result.record.status).toBe("in_progress");
    expect(result.record.idempotencyKey).toBe(KEY);
  });

  it("TC-02: P2002 collision, same hash, in_progress → in_progress result", async () => {
    const p2002 = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    mockCreate.mockRejectedValueOnce(p2002);
    mockFindUnique.mockResolvedValueOnce(makeRow({ status: "in_progress", requestHash: HASH }));

    const result = await beginCheckoutAttempt({ shopId: SHOP, idempotencyKey: KEY, requestHash: HASH });

    expect(result.kind).toBe("in_progress");
    expect(result.record.status).toBe("in_progress");
  });

  it("TC-03: existing terminal record with same hash and responseBody → replay", async () => {
    const p2002 = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    mockCreate.mockRejectedValueOnce(p2002);
    const responseBody = { orderId: "order-42", total: 100 };
    mockFindUnique.mockResolvedValueOnce(
      makeRow({ status: "succeeded", requestHash: HASH, responseStatus: 200, responseBody })
    );

    const result = await beginCheckoutAttempt({ shopId: SHOP, idempotencyKey: KEY, requestHash: HASH });

    expect(result.kind).toBe("replay");
    if (result.kind === "replay") {
      expect(result.responseStatus).toBe(200);
      expect(result.responseBody).toEqual(responseBody);
    }
  });

  it("TC-04: existing record with different requestHash → conflict", async () => {
    const p2002 = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    mockCreate.mockRejectedValueOnce(p2002);
    mockFindUnique.mockResolvedValueOnce(makeRow({ requestHash: "different-hash" }));

    const result = await beginCheckoutAttempt({ shopId: SHOP, idempotencyKey: KEY, requestHash: HASH });

    expect(result.kind).toBe("conflict");
  });

  it("P2002 with finalizing status → in_progress result", async () => {
    const p2002 = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    mockCreate.mockRejectedValueOnce(p2002);
    mockFindUnique.mockResolvedValueOnce(makeRow({ status: "finalizing", requestHash: HASH }));

    const result = await beginCheckoutAttempt({ shopId: SHOP, idempotencyKey: KEY, requestHash: HASH });

    expect(result.kind).toBe("in_progress");
  });

  it("non-P2002 error is re-thrown", async () => {
    const dbErr = new Error("Connection error");
    mockCreate.mockRejectedValueOnce(dbErr);

    await expect(
      beginCheckoutAttempt({ shopId: SHOP, idempotencyKey: KEY, requestHash: HASH })
    ).rejects.toThrow("Connection error");
  });
});

// ---------------------------------------------------------------------------
// markCheckoutAttemptReservation
// ---------------------------------------------------------------------------

describe("markCheckoutAttemptReservation", () => {
  it("TC-05: updates holdId, shopTransactionId, provider fields", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });

    await markCheckoutAttemptReservation({
      shopId: SHOP,
      idempotencyKey: KEY,
      holdId: "hold-001",
      shopTransactionId: "txn-001",
      acceptedLegalTerms: true,
      acceptedLegalTermsAt: "2026-01-01T10:00:00Z",
      provider: "axerve",
      buyerName: "Alice",
    });

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { shopId: SHOP, idempotencyKey: KEY },
        data: expect.objectContaining({
          holdId: "hold-001",
          shopTransactionId: "txn-001",
          acceptedLegalTerms: true,
          provider: "axerve",
          buyerName: "Alice",
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// markCheckoutAttemptResult
// ---------------------------------------------------------------------------

describe("markCheckoutAttemptResult", () => {
  it("TC-06: updates status to succeeded", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });

    await markCheckoutAttemptResult({
      shopId: SHOP,
      idempotencyKey: KEY,
      status: "succeeded",
      responseStatus: 200,
      responseBody: { orderId: "order-99" },
    });

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "succeeded", responseStatus: 200 }),
      })
    );
  });

  it("TC-07: accepts needs_review as valid status (no TypeScript error)", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });

    // If this compiles and runs without error, TC-07 passes.
    await markCheckoutAttemptResult({
      shopId: SHOP,
      idempotencyKey: KEY,
      status: "needs_review",
      responseStatus: 202,
      responseBody: {},
    });

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "needs_review" }) })
    );
  });
});

// ---------------------------------------------------------------------------
// recordCheckoutAttemptStripeSession
// ---------------------------------------------------------------------------

describe("recordCheckoutAttemptStripeSession", () => {
  it("updates provider, stripeSessionId, stripeSessionExpiresAt", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });

    await recordCheckoutAttemptStripeSession({
      shopId: SHOP,
      idempotencyKey: KEY,
      stripeSessionId: "cs_test_123",
      stripeSessionExpiresAt: "2026-01-01T11:00:00Z",
    });

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: "stripe",
          stripeSessionId: "cs_test_123",
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// markCheckoutAttemptPaymentAttempted
// ---------------------------------------------------------------------------

describe("markCheckoutAttemptPaymentAttempted", () => {
  it("sets paymentAttemptedAt and updatedAt", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });
    const now = new Date("2026-01-01T10:30:00Z");

    await markCheckoutAttemptPaymentAttempted({ shopId: SHOP, idempotencyKey: KEY, now });

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentAttemptedAt: now, updatedAt: now }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// beginStripeCheckoutFinalization
// ---------------------------------------------------------------------------

describe("beginStripeCheckoutFinalization", () => {
  it("TC-08: in_progress record → acquired, status set to finalizing", async () => {
    const existingRow = makeRow({ status: "in_progress", stripeSessionId: "cs_1" });
    const finalizedRow = makeRow({ status: "finalizing", stripeSessionId: "cs_1" });

    mockFindFirst.mockResolvedValueOnce(existingRow);
    mockUpdate.mockResolvedValueOnce(finalizedRow);

    const result = await beginStripeCheckoutFinalization({ shopId: SHOP, stripeSessionId: "cs_1" });

    expect(result.kind).toBe("acquired");
    if (result.kind === "acquired") {
      expect(result.record.status).toBe("finalizing");
    }
  });

  it("TC-09: finalizing record → busy", async () => {
    const existingRow = makeRow({ status: "finalizing", stripeSessionId: "cs_2" });
    mockFindFirst.mockResolvedValueOnce(existingRow);

    const result = await beginStripeCheckoutFinalization({ shopId: SHOP, stripeSessionId: "cs_2" });

    expect(result.kind).toBe("busy");
  });

  it("TC-10: succeeded record → already_finalized", async () => {
    const existingRow = makeRow({ status: "succeeded", stripeSessionId: "cs_3" });
    mockFindFirst.mockResolvedValueOnce(existingRow);

    const result = await beginStripeCheckoutFinalization({ shopId: SHOP, stripeSessionId: "cs_3" });

    expect(result.kind).toBe("already_finalized");
  });

  it("TC-11: no matching stripeSessionId → no_match", async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    const result = await beginStripeCheckoutFinalization({ shopId: SHOP, stripeSessionId: "unknown" });

    expect(result.kind).toBe("no_match");
  });

  it("failed record → already_finalized", async () => {
    const existingRow = makeRow({ status: "failed", stripeSessionId: "cs_4" });
    mockFindFirst.mockResolvedValueOnce(existingRow);

    const result = await beginStripeCheckoutFinalization({ shopId: SHOP, stripeSessionId: "cs_4" });

    expect(result.kind).toBe("already_finalized");
  });
});

// ---------------------------------------------------------------------------
// listStaleInProgressCheckoutAttempts
// ---------------------------------------------------------------------------

describe("listStaleInProgressCheckoutAttempts", () => {
  it("TC-12: returns records with status in_progress or finalizing older than staleBefore", async () => {
    const staleDate = new Date("2026-01-01T08:00:00Z");
    const staleRows = [
      makeRow({ status: "in_progress", updatedAt: new Date("2026-01-01T07:00:00Z") }),
      makeRow({ status: "finalizing", idempotencyKey: "key-2", updatedAt: new Date("2026-01-01T06:00:00Z") }),
    ];
    mockFindMany.mockResolvedValueOnce(staleRows);

    const result = await listStaleInProgressCheckoutAttempts({ shopId: SHOP, staleBefore: staleDate });

    expect(result).toHaveLength(2);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          shopId: SHOP,
          status: { in: ["in_progress", "finalizing"] },
          updatedAt: { lt: staleDate },
        }),
      })
    );
  });
});
