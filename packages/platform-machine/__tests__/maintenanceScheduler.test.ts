// packages/platform-machine/__tests__/maintenanceScheduler.test.ts

describe("runMaintenanceScan", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("logs retirement and maintenance and ignores unknown products", async () => {
    const readdir = jest.fn().mockResolvedValue(["shop1"]);
    const readInventory = jest.fn().mockResolvedValue([
      { sku: "retire", wearCount: 5 },
      { sku: "maint", wearCount: 6 },
      { sku: "unknown", wearCount: 1 },
    ]);
    const readProducts = jest.fn().mockResolvedValue([
      { sku: "retire", wearAndTearLimit: 5 },
      { sku: "maint", maintenanceCycle: 3 },
    ]);
    const info = jest.fn();
    const error = jest.fn();

    jest.doMock("fs/promises", () => ({ __esModule: true, readdir }));
    jest.doMock("@acme/platform-core/repositories/inventory.server", () => ({
      __esModule: true,
      readInventory,
    }));
    jest.doMock("@acme/platform-core/repositories/products.server", () => ({
      __esModule: true,
      readRepo: readProducts,
    }));
    jest.doMock("@acme/platform-core/utils", () => ({
      __esModule: true,
      logger: { info, error },
    }));

    const { runMaintenanceScan } = await import(
      "@acme/platform-machine/maintenanceScheduler"
    );

    await runMaintenanceScan("/data");

    expect(info).toHaveBeenCalledTimes(2);
    expect(info).toHaveBeenNthCalledWith(1, "item needs retirement", {
      shopId: "shop1",
      sku: "retire",
    });
    expect(info).toHaveBeenNthCalledWith(2, "item needs maintenance", {
      shopId: "shop1",
      sku: "maint",
    });
  });

  it("ignores items without wearCount", async () => {
    const readdir = jest.fn().mockResolvedValue(["shop1"]);
    const readInventory = jest.fn().mockResolvedValue([{ sku: "maint" }]);
    const readProducts = jest.fn().mockResolvedValue([
      { sku: "maint", wearAndTearLimit: 5, maintenanceCycle: 3 },
    ]);
    const info = jest.fn();
    const error = jest.fn();

    jest.doMock("fs/promises", () => ({ __esModule: true, readdir }));
    jest.doMock("@acme/platform-core/repositories/inventory.server", () => ({
      __esModule: true,
      readInventory,
    }));
    jest.doMock("@acme/platform-core/repositories/products.server", () => ({
      __esModule: true,
      readRepo: readProducts,
    }));
    jest.doMock("@acme/platform-core/utils", () => ({
      __esModule: true,
      logger: { info, error },
    }));

    const { runMaintenanceScan } = await import(
      "@acme/platform-machine/maintenanceScheduler"
    );

    await runMaintenanceScan("/data");

    expect(info).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("logs read errors and continues scanning other shops", async () => {
    const readdir = jest.fn().mockResolvedValue(["shop1", "shop2"]);
    const readInventory = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ sku: "maint", wearCount: 3 }]);
    const readProducts = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce([{ sku: "maint", maintenanceCycle: 3 }]);
    const info = jest.fn();
    const error = jest.fn();

    jest.doMock("fs/promises", () => ({ __esModule: true, readdir }));
    jest.doMock("@acme/platform-core/repositories/inventory.server", () => ({
      __esModule: true,
      readInventory,
    }));
    jest.doMock("@acme/platform-core/repositories/products.server", () => ({
      __esModule: true,
      readRepo: readProducts,
    }));
    jest.doMock("@acme/platform-core/utils", () => ({
      __esModule: true,
      logger: { info, error },
    }));

    const { runMaintenanceScan } = await import(
      "@acme/platform-machine/maintenanceScheduler"
    );

    await runMaintenanceScan("/data");

    expect(error).toHaveBeenCalledWith("maintenance scan failed", {
      shopId: "shop1",
      err: expect.any(Error),
    });
    expect(info).toHaveBeenCalledWith("item needs maintenance", {
      shopId: "shop2",
      sku: "maint",
    });
  });
});

describe("startMaintenanceScheduler", () => {
  let timer: NodeJS.Timeout | undefined;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
    jest.useRealTimers();
  });

  it("runs immediately, schedules daily, and can be stopped", async () => {
    const readdir = jest.fn().mockResolvedValue(["shop1"]);
    const readInventory = jest.fn().mockResolvedValue([]);
    const readProducts = jest.fn().mockResolvedValue([]);
    const logger = { info: jest.fn(), error: jest.fn() };

    jest.doMock("fs/promises", () => ({ __esModule: true, readdir }));
    jest.doMock("@acme/platform-core/repositories/inventory.server", () => ({
      __esModule: true,
      readInventory,
    }));
    jest.doMock("@acme/platform-core/repositories/products.server", () => ({
      __esModule: true,
      readRepo: readProducts,
    }));
    jest.doMock("@acme/platform-core/utils", () => ({ __esModule: true, logger }));

    const scheduler = await import(
      "@acme/platform-machine/maintenanceScheduler"
    );
    const runMaintenanceScanSpy = jest.spyOn(
      scheduler,
      "runMaintenanceScan",
    );
    const setIntervalSpy = jest.spyOn(global, "setInterval");

    timer = scheduler.startMaintenanceScheduler();
    // allow async scan to complete
    await Promise.resolve();
    await Promise.resolve();

    expect(readInventory).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      24 * 60 * 60 * 1000,
    );

    jest.advanceTimersByTime(24 * 60 * 60 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(readInventory).toHaveBeenCalledTimes(2);

    clearInterval(timer);
    timer = undefined;
    jest.advanceTimersByTime(24 * 60 * 60 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(readInventory).toHaveBeenCalledTimes(2);
  });

  it("logs errors from failed scans", async () => {
    const logger = { info: jest.fn(), error: jest.fn() };
    const errorSpy = jest.spyOn(logger, "error");
    jest.doMock("@acme/platform-core/utils", () => ({ __esModule: true, logger }));

    const scheduler = await import(
      "@acme/platform-machine/maintenanceScheduler"
    );
    jest
      .spyOn(scheduler, "runMaintenanceScan")
      .mockRejectedValue(new Error("fail"));

    timer = scheduler.startMaintenanceScheduler();
    await Promise.resolve();
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledWith("maintenance scan failed", {
      err: expect.any(Error),
    });

    clearInterval(timer);
    timer = undefined;
  });
});

