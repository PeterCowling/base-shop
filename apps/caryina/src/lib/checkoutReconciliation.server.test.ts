import { reconcileStaleCheckoutAttempts } from "@/lib/checkoutReconciliation.server";

jest.mock("@acme/platform-core/inventoryHolds", () => ({
  releaseInventoryHold: jest.fn(),
}));

jest.mock("@acme/platform-core/email", () => ({
  sendSystemEmail: jest.fn(),
}));

jest.mock("@acme/platform-core/utils", () => ({
  recordMetric: jest.fn(),
}));

jest.mock("@/lib/checkoutIdempotency.server", () => ({
  listStaleInProgressCheckoutAttempts: jest.fn(),
  markCheckoutAttemptResult: jest.fn(),
}));

const { releaseInventoryHold } = jest.requireMock("@acme/platform-core/inventoryHolds") as {
  releaseInventoryHold: jest.Mock;
};

const { sendSystemEmail } = jest.requireMock("@acme/platform-core/email") as {
  sendSystemEmail: jest.Mock;
};

const {
  listStaleInProgressCheckoutAttempts,
  markCheckoutAttemptResult,
} = jest.requireMock("@/lib/checkoutIdempotency.server") as {
  listStaleInProgressCheckoutAttempts: jest.Mock;
  markCheckoutAttemptResult: jest.Mock;
};

describe("checkoutReconciliation.server", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendSystemEmail.mockResolvedValue(undefined);
    releaseInventoryHold.mockResolvedValue({ ok: true, status: "released" });
    markCheckoutAttemptResult.mockResolvedValue(undefined);
  });

  it("releases stale attempts where payment was never attempted", async () => {
    listStaleInProgressCheckoutAttempts.mockResolvedValue([
      {
        idempotencyKey: "idem-1",
        requestHash: "hash-1",
        status: "in_progress",
        createdAt: "2026-03-02T09:00:00.000Z",
        updatedAt: "2026-03-02T09:01:00.000Z",
        holdId: "hold-1",
      },
    ]);

    const summary = await reconcileStaleCheckoutAttempts({
      shopId: "caryina",
      staleMinutes: 1,
    });

    expect(summary).toEqual({
      scanned: 1,
      released: 1,
      failedWithoutHold: 0,
      needsReview: 0,
      errors: 0,
    });
    expect(releaseInventoryHold).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "caryina",
        holdId: "hold-1",
      }),
    );
    expect(markCheckoutAttemptResult).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "idem-1",
        status: "failed",
        errorCode: "checkout_reconciled_stale",
      }),
    );
  });

  it("marks stale attempts with payment attempted as needs_review and sends alert", async () => {
    listStaleInProgressCheckoutAttempts.mockResolvedValue([
      {
        idempotencyKey: "idem-2",
        requestHash: "hash-2",
        status: "in_progress",
        createdAt: "2026-03-02T09:00:00.000Z",
        updatedAt: "2026-03-02T09:01:00.000Z",
        holdId: "hold-2",
        paymentAttemptedAt: "2026-03-02T09:01:30.000Z",
      },
    ]);

    const summary = await reconcileStaleCheckoutAttempts({
      shopId: "caryina",
      staleMinutes: 1,
    });

    expect(summary).toEqual({
      scanned: 1,
      released: 0,
      failedWithoutHold: 0,
      needsReview: 1,
      errors: 0,
    });
    expect(releaseInventoryHold).not.toHaveBeenCalled();
    expect(markCheckoutAttemptResult).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "idem-2",
        status: "needs_review",
        errorCode: "checkout_needs_review",
      }),
    );
    expect(sendSystemEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("[ALERT] Caryina checkout needs review"),
      }),
    );
  });

  it("marks stale attempts as needs_review when hold is already committed", async () => {
    listStaleInProgressCheckoutAttempts.mockResolvedValue([
      {
        idempotencyKey: "idem-3",
        requestHash: "hash-3",
        status: "in_progress",
        createdAt: "2026-03-02T09:00:00.000Z",
        updatedAt: "2026-03-02T09:01:00.000Z",
        holdId: "hold-3",
      },
    ]);
    releaseInventoryHold.mockResolvedValue({ ok: false, reason: "committed" });

    const summary = await reconcileStaleCheckoutAttempts({
      shopId: "caryina",
      staleMinutes: 1,
    });

    expect(summary).toEqual({
      scanned: 1,
      released: 0,
      failedWithoutHold: 0,
      needsReview: 1,
      errors: 0,
    });
    expect(markCheckoutAttemptResult).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "idem-3",
        status: "needs_review",
        errorCode: "checkout_needs_review",
      }),
    );
    expect(sendSystemEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("[ALERT] Caryina checkout needs review"),
      }),
    );
  });

  it("counts reconciliation exceptions without aborting the full run", async () => {
    listStaleInProgressCheckoutAttempts.mockResolvedValue([
      {
        idempotencyKey: "idem-4",
        requestHash: "hash-4",
        status: "in_progress",
        createdAt: "2026-03-02T09:00:00.000Z",
        updatedAt: "2026-03-02T09:01:00.000Z",
        holdId: "hold-4",
      },
    ]);
    releaseInventoryHold.mockRejectedValue(new Error("inventory service unavailable"));

    const summary = await reconcileStaleCheckoutAttempts({
      shopId: "caryina",
      staleMinutes: 1,
    });

    expect(summary).toEqual({
      scanned: 1,
      released: 0,
      failedWithoutHold: 0,
      needsReview: 0,
      errors: 1,
    });
    expect(markCheckoutAttemptResult).not.toHaveBeenCalled();
  });
});
