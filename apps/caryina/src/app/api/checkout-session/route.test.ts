import { NextRequest } from "next/server";

import { POST } from "./route";

jest.mock("@acme/axerve", () => {
  class MockAxerveError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AxerveError";
    }
  }
  return {
    callPayment: jest.fn(),
    AxerveError: MockAxerveError,
  };
});

jest.mock("@acme/platform-core/cartCookie", () => ({
  CART_COOKIE: "__Host-CART_ID",
  decodeCartCookie: jest.fn(),
}));

jest.mock("@acme/platform-core/cartStore", () => ({
  getCart: jest.fn(),
  deleteCart: jest.fn(),
}));

jest.mock("@acme/platform-core/cart", () => ({
  validateCart: jest.fn(),
}));

jest.mock("@acme/platform-core/inventoryHolds", () => ({
  commitInventoryHold: jest.fn(),
  releaseInventoryHold: jest.fn(),
}));

jest.mock("@acme/platform-core/email", () => ({
  sendSystemEmail: jest.fn(),
}));

jest.mock("@acme/platform-core/utils", () => ({
  recordMetric: jest.fn(),
}));

jest.mock("../../../lib/checkoutIdempotency.server", () => ({
  beginCheckoutAttempt: jest.fn(),
  buildCheckoutRequestHash: jest.fn(() => "hash-123"),
  markCheckoutAttemptPaymentAttempted: jest.fn(),
  markCheckoutAttemptReservation: jest.fn(),
  markCheckoutAttemptResult: jest.fn(),
}));

jest.mock("../../../lib/checkoutReconciliation.server", () => ({
  reconcileStaleCheckoutAttempts: jest.fn(),
}));

const mockAxerve = jest.requireMock("@acme/axerve") as {
  callPayment: jest.Mock;
  AxerveError: new (message: string) => Error;
};
const { callPayment } = mockAxerve;
const MockAxerveError = mockAxerve.AxerveError;

const { decodeCartCookie } = jest.requireMock("@acme/platform-core/cartCookie") as {
  decodeCartCookie: jest.Mock;
};

const { getCart, deleteCart } = jest.requireMock("@acme/platform-core/cartStore") as {
  getCart: jest.Mock;
  deleteCart: jest.Mock;
};

const { validateCart } = jest.requireMock("@acme/platform-core/cart") as {
  validateCart: jest.Mock;
};

const { commitInventoryHold, releaseInventoryHold } = jest.requireMock(
  "@acme/platform-core/inventoryHolds",
) as {
  commitInventoryHold: jest.Mock;
  releaseInventoryHold: jest.Mock;
};

const { sendSystemEmail } = jest.requireMock("@acme/platform-core/email") as {
  sendSystemEmail: jest.Mock;
};

const {
  beginCheckoutAttempt,
  markCheckoutAttemptPaymentAttempted,
  markCheckoutAttemptReservation,
  markCheckoutAttemptResult,
} = jest.requireMock("../../../lib/checkoutIdempotency.server") as {
  beginCheckoutAttempt: jest.Mock;
  markCheckoutAttemptPaymentAttempted: jest.Mock;
  markCheckoutAttemptReservation: jest.Mock;
  markCheckoutAttemptResult: jest.Mock;
};

const { reconcileStaleCheckoutAttempts } = jest.requireMock(
  "../../../lib/checkoutReconciliation.server",
) as {
  reconcileStaleCheckoutAttempts: jest.Mock;
};

const VALID_BODY = {
  idempotencyKey: "idem-123",
  lang: "en",
  cardNumber: "4111111111111111",
  expiryMonth: "12",
  expiryYear: "2027",
  cvv: "123",
  buyerName: "Jane Doe",
  buyerEmail: "jane@example.com",
};

const makeReq = (body?: unknown) =>
  new NextRequest("http://localhost/api/checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

const mockCartItem = {
  sku: {
    id: "sku-1",
    title: "Silver Ring",
    price: 4500,
    stock: 5,
    sizes: [],
    slug: "silver-ring",
    description: "",
    deposit: 0,
    media: [],
    status: "active",
  },
  qty: 1,
};

describe("POST /api/checkout-session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    decodeCartCookie.mockReturnValue("cart-abc");
    getCart.mockResolvedValue({ "sku-1": mockCartItem });
    deleteCart.mockResolvedValue(undefined);
    validateCart.mockResolvedValue({
      valid: true,
      holdId: "hold-001",
      holdExpiresAt: new Date("2026-03-02T10:00:00.000Z"),
      items: [],
    });
    beginCheckoutAttempt.mockResolvedValue({
      kind: "acquired",
      record: {
        idempotencyKey: "idem-123",
        requestHash: "hash-123",
        status: "in_progress",
        createdAt: "2026-03-02T10:00:00.000Z",
        updatedAt: "2026-03-02T10:00:00.000Z",
      },
    });
    markCheckoutAttemptReservation.mockResolvedValue(undefined);
    markCheckoutAttemptPaymentAttempted.mockResolvedValue(undefined);
    markCheckoutAttemptResult.mockResolvedValue(undefined);
    reconcileStaleCheckoutAttempts.mockResolvedValue({
      scanned: 0,
      released: 0,
      failedWithoutHold: 0,
      needsReview: 0,
      errors: 0,
    });
    commitInventoryHold.mockResolvedValue(undefined);
    releaseInventoryHold.mockResolvedValue({ ok: true, status: "released" });
    sendSystemEmail.mockResolvedValue(undefined);
    callPayment.mockResolvedValue({
      success: true,
      transactionId: "txn-001",
      bankTransactionId: "bank-txn-001",
      authCode: "auth-456",
    });
    process.env.MERCHANT_NOTIFY_EMAIL = "merchant@test.com";
    delete process.env.CARYINA_CHECKOUT_AUTO_RECONCILE;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.MERCHANT_NOTIFY_EMAIL;
    delete process.env.CARYINA_CHECKOUT_AUTO_RECONCILE;
    jest.restoreAllMocks();
  });

  it("TC-06-01: success commits hold, clears cart, and stores succeeded idempotent result", async () => {
    const res = await POST(makeReq(VALID_BODY) as never);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      transactionId: string;
      amount: number;
      currency: string;
    };
    expect(body).toEqual({
      success: true,
      transactionId: "txn-001",
      amount: 4500,
      currency: "eur",
    });

    expect(beginCheckoutAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "caryina",
        idempotencyKey: "idem-123",
      }),
    );
    expect(validateCart).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "caryina",
        createHold: true,
      }),
    );
    expect(markCheckoutAttemptReservation).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "caryina",
        idempotencyKey: "idem-123",
        holdId: "hold-001",
      }),
    );
    expect(markCheckoutAttemptPaymentAttempted).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "caryina",
        idempotencyKey: "idem-123",
      }),
    );
    expect(commitInventoryHold).toHaveBeenCalledWith({
      shopId: "caryina",
      holdId: "hold-001",
    });
    expect(releaseInventoryHold).not.toHaveBeenCalled();
    expect(deleteCart).toHaveBeenCalledWith("cart-abc");
    expect(markCheckoutAttemptResult).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "caryina",
        idempotencyKey: "idem-123",
        status: "succeeded",
        responseStatus: 200,
      }),
    );

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("Max-Age=0");
    expect(setCookie).toContain("__Host-CART_ID=;");
  });

  it("TC-06-02: missing idempotency key returns 400", async () => {
    const { idempotencyKey: _omit, ...withoutKey } = VALID_BODY;
    const res = await POST(makeReq(withoutKey) as never);

    expect(res.status).toBe(400);
    expect(beginCheckoutAttempt).not.toHaveBeenCalled();
    expect(callPayment).not.toHaveBeenCalled();
  });

  it("TC-06-03: idempotent replay returns stored response and does not call payment", async () => {
    beginCheckoutAttempt.mockResolvedValue({
      kind: "replay",
      record: {
        idempotencyKey: "idem-123",
        requestHash: "hash-123",
        status: "succeeded",
        createdAt: "2026-03-02T10:00:00.000Z",
        updatedAt: "2026-03-02T10:01:00.000Z",
      },
      responseStatus: 200,
      responseBody: {
        success: true,
        transactionId: "txn-replay",
        amount: 4500,
        currency: "eur",
      },
    });

    const res = await POST(makeReq(VALID_BODY) as never);

    expect(res.status).toBe(200);
    expect(res.headers.get("x-idempotent-replay")).toBe("1");
    const body = (await res.json()) as { transactionId: string };
    expect(body.transactionId).toBe("txn-replay");
    expect(callPayment).not.toHaveBeenCalled();
    expect(validateCart).not.toHaveBeenCalled();
  });

  it("TC-06-04: in-progress duplicate returns 409 and does not run payment", async () => {
    beginCheckoutAttempt.mockResolvedValue({
      kind: "in_progress",
      record: {
        idempotencyKey: "idem-123",
        requestHash: "hash-123",
        status: "in_progress",
        createdAt: "2026-03-02T10:00:00.000Z",
        updatedAt: "2026-03-02T10:01:00.000Z",
      },
    });

    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(409);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("idempotency_in_progress");
    expect(callPayment).not.toHaveBeenCalled();
  });

  it("TC-06-05: payload mismatch duplicate returns 409", async () => {
    beginCheckoutAttempt.mockResolvedValue({
      kind: "conflict",
      record: {
        idempotencyKey: "idem-123",
        requestHash: "hash-old",
        status: "failed",
        createdAt: "2026-03-02T10:00:00.000Z",
        updatedAt: "2026-03-02T10:01:00.000Z",
      },
    });

    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(409);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("idempotency_payload_mismatch");
  });

  it("TC-06-06: insufficient stock returns 409 and marks attempt failed", async () => {
    validateCart.mockResolvedValue({
      valid: false,
      code: "INSUFFICIENT_STOCK",
      message: "Out of stock",
      insufficientItems: [
        {
          sku: "sku-1",
          variantKey: "sku-1",
          variantAttributes: {},
          requestedQuantity: 1,
          availableQuantity: 0,
          shortfall: 1,
        },
      ],
      recovery: [],
      retryable: false,
    });

    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      code: string;
      items: Array<{ requested: number; available: number }>;
    };
    expect(body.code).toBe("inventory_insufficient");
    expect(body.items[0]).toEqual(
      expect.objectContaining({ requested: 1, available: 0 }),
    );
    expect(callPayment).not.toHaveBeenCalled();
    expect(markCheckoutAttemptResult).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        responseStatus: 409,
      }),
    );
  });

  it("TC-06-07: payment decline releases hold and returns 402", async () => {
    callPayment.mockResolvedValue({
      success: false,
      transactionId: "txn-002",
      errorCode: "01",
      errorDescription: "Card declined",
    });

    const res = await POST(makeReq(VALID_BODY) as never);

    expect(res.status).toBe(402);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe("Card declined");
    expect(releaseInventoryHold).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "caryina",
        holdId: "hold-001",
        reason: "payment_declined",
      }),
    );
    expect(markCheckoutAttemptResult).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        responseStatus: 402,
        errorCode: "payment_declined",
      }),
    );
  });

  it("TC-06-08: Axerve SOAP error releases hold and returns 502", async () => {
    callPayment.mockRejectedValue(new MockAxerveError("SOAP connection failed"));

    const res = await POST(makeReq(VALID_BODY) as never);

    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Payment service unavailable");
    expect(releaseInventoryHold).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "caryina",
        holdId: "hold-001",
        reason: "payment_service_unavailable",
      }),
    );
    expect(markCheckoutAttemptResult).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        responseStatus: 502,
        errorCode: "payment_service_unavailable",
      }),
    );
  });

  it("TC-06-09: hold commit failure still returns success but marks attempt needs_review", async () => {
    commitInventoryHold.mockRejectedValue(new Error("commit failed"));

    const res = await POST(makeReq(VALID_BODY) as never);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
    expect(markCheckoutAttemptResult).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "needs_review",
        responseStatus: 200,
        errorCode: "hold_commit_failed",
      }),
    );
    expect(sendSystemEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("[ALERT] Caryina hold commit failed"),
      }),
    );
  });

  it("TC-06-10: inventory unavailable returns 503 and payment is not attempted", async () => {
    validateCart.mockResolvedValue({
      valid: false,
      code: "INVENTORY_UNAVAILABLE",
      message: "Unavailable",
      insufficientItems: [],
      recovery: [],
      retryable: true,
    });

    const res = await POST(makeReq(VALID_BODY) as never);

    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string; code: string };
    expect(body.error).toBe("Inventory backend unavailable");
    expect(body.code).toBe("inventory_unavailable");
    expect(callPayment).not.toHaveBeenCalled();
  });

  it("TC-06-11: auto-reconcile trigger runs when CARYINA_CHECKOUT_AUTO_RECONCILE=1", async () => {
    process.env.CARYINA_CHECKOUT_AUTO_RECONCILE = "1";

    const res = await POST(makeReq(VALID_BODY) as never);

    expect(res.status).toBe(200);
    expect(reconcileStaleCheckoutAttempts).toHaveBeenCalledWith({
      shopId: "caryina",
      maxAttempts: 5,
    });
  });

  it("TC-06-12: auto-reconcile failures are logged without breaking checkout", async () => {
    process.env.CARYINA_CHECKOUT_AUTO_RECONCILE = "1";
    reconcileStaleCheckoutAttempts.mockRejectedValue(new Error("reconcile failed"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(makeReq(VALID_BODY) as never);

    expect(res.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(errorSpy).toHaveBeenCalledWith(
      "Auto checkout reconciliation failed",
      expect.any(Error),
    );
  });
});
