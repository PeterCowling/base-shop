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

  it("uses core env interval when shop env invalid", async () => {
    process.env.LATE_FEE_INTERVAL_MS_SHOP = "xyz";
    const { coreEnv } = await import("@acme/config/env/core");
    coreEnv.LATE_FEE_INTERVAL_MS = 120000;

    const readdir = jest.fn().mockResolvedValue(["shop"]);
    const readFile = jest.fn().mockImplementation((path: string) => {
      if (path.endsWith("shop/settings.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeeService: { enabled: true } }),
        );
      if (path.endsWith("shop/shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 5 } }),
        );
      return Promise.reject(new Error("not found"));
    });
    jest.doMock("fs/promises", () => ({ __esModule: true, readdir, readFile }));

    const mod = await import("../src/lateFeeService");
    jest.spyOn(mod, "chargeLateFeesOnce").mockResolvedValue();

    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 111 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await mod.startLateFeeService();

    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 120000);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(111 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
    delete process.env.LATE_FEE_INTERVAL_MS_SHOP;
    delete coreEnv.LATE_FEE_INTERVAL_MS;
  });
});

