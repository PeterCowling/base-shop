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

  it("returns early for sale shops without scheduling", async () => {
    const { setupLateFeeTest } = await import("./helpers/lateFee");
    const mocks = await setupLateFeeTest({
      orders: [],
      shop: { type: "sale" },
    });
    mocks.readFile.mockImplementation((path: string) => {
      if (path.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          }),
        );
      if (path.endsWith("shop.json"))
        return Promise.resolve(JSON.stringify({ type: "sale" }));
      return Promise.reject(new Error("not found"));
    });
    jest.doMock("@platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/data",
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));

    const mod = await import("../src/lateFeeService");
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 111 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await mod.startLateFeeService();

    expect(mocks.readOrders).not.toHaveBeenCalled();
    expect(mocks.stripeCharge).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
    mocks.restore();
  });
});

