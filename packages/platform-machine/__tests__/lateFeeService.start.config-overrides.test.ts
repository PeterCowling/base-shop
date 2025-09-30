describe("startLateFeeService", () => {
  const OLD_ENV = process.env;
  let error: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));
    jest.doMock("@platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/data",
    }));
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: {
        checkout: { sessions: { retrieve: jest.fn() } },
        paymentIntents: { create: jest.fn() },
      },
    }));
    error = jest.fn();
    jest.doMock("@platform-core/utils", () => ({
      __esModule: true,
      logger: { error, info: jest.fn() },
    }));
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("applies start config overrides", async () => {
    const { setupLateFeeTest, NOW } = await import("./helpers/lateFee");
    const overdueOrder = {
      sessionId: "sess_1",
      returnDueDate: new Date(NOW - 5 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;
    const mocks = await setupLateFeeTest({ orders: [overdueOrder] });
    process.env.LATE_FEE_ENABLED_TEST = "false";
    process.env.LATE_FEE_INTERVAL_MS_TEST = "600000";
    mocks.readFile.mockImplementation((path: string) => {
      if (path.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: false, intervalMinutes: 10 },
          }),
        );
      if (path.endsWith("shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 25 } }),
        );
      return Promise.reject(new Error("not found"));
    });
    jest.doMock("@platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/data",
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: { LATE_FEE_ENABLED: false, LATE_FEE_INTERVAL_MS: 300000 },
      loadCoreEnv: () => ({
        LATE_FEE_ENABLED: false,
        LATE_FEE_INTERVAL_MS: 300000,
      }),
    }));

    const mod = await import("../src/lateFeeService");
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(120000);
        return 111 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await mod.startLateFeeService({
      test: { enabled: true, intervalMinutes: 2 },
    });

    expect(mocks.stripeCharge).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 25 * 100, currency: "usd" }),
    );
    expect(mocks.markLateFeeCharged).toHaveBeenCalledWith(
      "test",
      "sess_1",
      25,
    );
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(111 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
    mocks.restore();
  });
});

