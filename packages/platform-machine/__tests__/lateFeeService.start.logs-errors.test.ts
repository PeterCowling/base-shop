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

  it("logs errors from chargeLateFeesOnce", async () => {
    const readdir = jest.fn().mockResolvedValue(["shop"]);
    const readFile = jest.fn().mockImplementation((path: string) => {
      if (path.endsWith("shop/settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (path.endsWith("shop/shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 5 } })
        );
      return Promise.reject(new Error("not found"));
    });
    jest.doMock("fs/promises", () => ({ __esModule: true, readdir, readFile }));
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 111 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const err = new Error("boom");
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      readOrders: jest.fn().mockRejectedValue(err),
      markLateFeeCharged: jest.fn(),
    }));
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: {
        checkout: { sessions: { retrieve: jest.fn() } },
        paymentIntents: { create: jest.fn() },
      },
    }));

    const mod = await import("../src/lateFeeService");
    const stop = await mod.startLateFeeService();

    expect(error).toHaveBeenCalledWith("late fee processing failed", {
      shopId: "shop",
      err,
    });

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

