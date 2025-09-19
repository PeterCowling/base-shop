describe("chargeLateFeesOnce", () => {
  it("continues when shop policy cannot be loaded", async () => {
    const { setupLateFeeTest } = await import("./helpers/lateFee");
    const mocks = await setupLateFeeTest({ orders: [] });
    mocks.readFile.mockRejectedValue(new Error("no policy"));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    try {
      await chargeLateFeesOnce();
    } finally {
      mocks.restore();
    }

    expect(mocks.readOrders).not.toHaveBeenCalled();
  });

  it("charges overdue orders", async () => {
    const { setupLateFeeTest, NOW } = await import("./helpers/lateFee");
    const overdueOrder = {
      id: "1",
      sessionId: "sess_1",
      shop: "test",
      deposit: 0,
      startedAt: new Date(NOW - 5 * 24 * 60 * 60 * 1000).toISOString(),
      returnDueDate: new Date(NOW - 4 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;
    const mocks = await setupLateFeeTest({ orders: [overdueOrder] });
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    try {
      await chargeLateFeesOnce();
    } finally {
      mocks.restore();
    }

    expect(mocks.stripeCharge).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 25 * 100, currency: "usd" })
    );
    expect(mocks.markLateFeeCharged).toHaveBeenCalledWith("test", "sess_1", 25);
  });

  it("skips orders within the grace period", async () => {
    const { setupLateFeeTest, NOW } = await import("./helpers/lateFee");
    const graceOrder = {
      sessionId: "sess_1",
      returnDueDate: new Date(NOW - 1 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;
    const mocks = await setupLateFeeTest({ orders: [graceOrder] });
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    try {
      await chargeLateFeesOnce();
    } finally {
      mocks.restore();
    }

    expect(mocks.stripeRetrieve).not.toHaveBeenCalled();
    expect(mocks.stripeCharge).not.toHaveBeenCalled();
    expect(mocks.markLateFeeCharged).not.toHaveBeenCalled();
  });

  it("skips orders already returned or charged", async () => {
    const { setupLateFeeTest, NOW } = await import("./helpers/lateFee");
    const orders = [
      {
        sessionId: "sess_returned",
        returnDueDate: new Date(NOW - 5 * 24 * 60 * 60 * 1000).toISOString(),
        returnReceivedAt: new Date().toISOString(),
      },
      {
        sessionId: "sess_charged",
        returnDueDate: new Date(NOW - 5 * 24 * 60 * 60 * 1000).toISOString(),
        lateFeeCharged: 5,
      },
    ] as any[];
    const mocks = await setupLateFeeTest({ orders });
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    try {
      await chargeLateFeesOnce();
    } finally {
      mocks.restore();
    }

    expect(mocks.stripeRetrieve).not.toHaveBeenCalled();
    expect(mocks.stripeCharge).not.toHaveBeenCalled();
    expect(mocks.markLateFeeCharged).not.toHaveBeenCalled();
  });

  it("logs errors when Stripe charge fails", async () => {
    const { setupLateFeeTest, NOW } = await import("./helpers/lateFee");
    const overdueOrder = {
      sessionId: "sess_1",
      returnDueDate: new Date(NOW - 5 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;
    const mocks = await setupLateFeeTest({ orders: [overdueOrder] });
    const { logger } = await import("@platform-core/utils");
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));
    const err = new Error("boom");
    mocks.stripeCharge.mockRejectedValueOnce(err);

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    try {
      await chargeLateFeesOnce();
    } finally {
      mocks.restore();
    }

    expect(logger.error).toHaveBeenCalledWith(
      "late fee charge failed",
      expect.objectContaining({ shopId: "test", sessionId: "sess_1", err })
    );
    expect(mocks.markLateFeeCharged).not.toHaveBeenCalled();
  });

  it("skips charging when payment_intent is a string", async () => {
    const { setupLateFeeTest, NOW } = await import("./helpers/lateFee");
    const overdueOrder = {
      sessionId: "sess_1",
      returnDueDate: new Date(NOW - 5 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;
    const mocks = await setupLateFeeTest({ orders: [overdueOrder] });
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));
    mocks.stripeRetrieve.mockResolvedValueOnce({
      payment_intent: "pi_1",
      customer: { id: "cus_1" },
      currency: "usd",
    });

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    try {
      await chargeLateFeesOnce();
    } finally {
      mocks.restore();
    }

    expect(mocks.stripeCharge).not.toHaveBeenCalled();
    expect(mocks.markLateFeeCharged).not.toHaveBeenCalled();
  });

  it("charges when payment_intent is object and uses customer.id", async () => {
    const { setupLateFeeTest, NOW } = await import("./helpers/lateFee");
    const overdueOrder = {
      sessionId: "sess_1",
      returnDueDate: new Date(NOW - 5 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;
    const mocks = await setupLateFeeTest({ orders: [overdueOrder] });
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));
    mocks.stripeRetrieve.mockResolvedValueOnce({
      payment_intent: { payment_method: "pm_1" },
      customer: { id: "cus_1" },
      currency: "usd",
    });

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    try {
      await chargeLateFeesOnce();
    } finally {
      mocks.restore();
    }

    expect(mocks.stripeCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25 * 100,
        currency: "usd",
        customer: "cus_1",
        payment_method: "pm_1",
      })
    );
    expect(mocks.markLateFeeCharged).toHaveBeenCalledWith("test", "sess_1", 25);
  });

  it("does not charge when customer or payment method is missing", async () => {
    const { setupLateFeeTest, NOW } = await import("./helpers/lateFee");
    const overdueOrder = {
      sessionId: "sess_1",
      returnDueDate: new Date(NOW - 5 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;
    const mocks = await setupLateFeeTest({ orders: [overdueOrder] });
    const { logger } = await import("@platform-core/utils");
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));
    mocks.stripeRetrieve.mockResolvedValueOnce({ currency: "usd" });

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    try {
      await chargeLateFeesOnce();
    } finally {
      mocks.restore();
    }

    expect(mocks.stripeCharge).not.toHaveBeenCalled();
    expect(mocks.markLateFeeCharged).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
