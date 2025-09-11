jest.mock("fs/promises", () => ({
  readdir: jest.fn(),
}));

jest.mock("@platform-core/utils", () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

jest.mock("@platform-core/repositories/inventory.server", () => ({
  readInventory: jest.fn(),
}));

jest.mock("@platform-core/repositories/products.server", () => ({
  readRepo: jest.fn(),
}));

import { readdir } from "fs/promises";
import { logger } from "@platform-core/utils";
import { readInventory } from "@platform-core/repositories/inventory.server";
import { readRepo as readProducts } from "@platform-core/repositories/products.server";
import {
  runMaintenanceScan,
  startMaintenanceScheduler,
} from "../maintenanceScheduler";
import * as maintenanceScheduler from "../maintenanceScheduler";

describe("runMaintenanceScan", () => {
  const readdirMock = readdir as unknown as jest.Mock;
  const inventoryMock = readInventory as unknown as jest.Mock;
  const productsMock = readProducts as unknown as jest.Mock;
  const infoMock = logger.info as unknown as jest.Mock;
  const errorMock = logger.error as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips inventory items without a matching product", async () => {
    readdirMock.mockResolvedValueOnce(["shop1"]);
    inventoryMock.mockResolvedValueOnce([{ sku: "missing", wearCount: 1 }]);
    productsMock.mockResolvedValueOnce([]);

    await runMaintenanceScan("/data");

    expect(infoMock).not.toHaveBeenCalled();
  });

  it("logs retirement when wear exceeds limit", async () => {
    readdirMock.mockResolvedValueOnce(["shop1"]);
    inventoryMock.mockResolvedValueOnce([{ sku: "sku1", wearCount: 5 }]);
    productsMock.mockResolvedValueOnce([{ sku: "sku1", wearAndTearLimit: 3 }]);

    await runMaintenanceScan("/data");

    expect(infoMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith("item needs retirement", {
      shopId: "shop1",
      sku: "sku1",
    });
  });

  it("logs maintenance when wear hits cycle multiple", async () => {
    readdirMock.mockResolvedValueOnce(["shop1"]);
    inventoryMock.mockResolvedValueOnce([{ sku: "sku1", wearCount: 4 }]);
    productsMock.mockResolvedValueOnce([
      { sku: "sku1", wearAndTearLimit: 10, maintenanceCycle: 2 },
    ]);

    await runMaintenanceScan("/data");

    expect(infoMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith("item needs maintenance", {
      shopId: "shop1",
      sku: "sku1",
    });
  });

  it("does not log when wear is below thresholds", async () => {
    readdirMock.mockResolvedValueOnce(["shop1"]);
    inventoryMock.mockResolvedValueOnce([{ sku: "sku1", wearCount: 3 }]);
    productsMock.mockResolvedValueOnce([
      { sku: "sku1", wearAndTearLimit: 10, maintenanceCycle: 5 },
    ]);

    await runMaintenanceScan("/data");

    expect(infoMock).not.toHaveBeenCalled();
  });

  it("does not log when wear count is zero", async () => {
    readdirMock.mockResolvedValueOnce(["shop1"]);
    inventoryMock.mockResolvedValueOnce([{ sku: "sku1", wearCount: 0 }]);
    productsMock.mockResolvedValueOnce([
      { sku: "sku1", wearAndTearLimit: 10, maintenanceCycle: 5 },
    ]);

    await runMaintenanceScan("/data");

    expect(infoMock).not.toHaveBeenCalled();
  });

  it("logs an error and continues processing other shops", async () => {
    readdirMock.mockResolvedValueOnce(["badShop", "goodShop"]);
    inventoryMock
      .mockResolvedValueOnce([{ sku: "badSku", wearCount: 1 }])
      .mockResolvedValueOnce([{ sku: "goodSku", wearCount: 5 }]);
    productsMock
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce([{ sku: "goodSku", wearAndTearLimit: 3 }]);

    await runMaintenanceScan("/data");

    expect(errorMock).toHaveBeenCalledWith("maintenance scan failed", {
      shopId: "badShop",
      err: expect.any(Error),
    });
    expect(infoMock).toHaveBeenCalledWith("item needs retirement", {
      shopId: "goodShop",
      sku: "goodSku",
    });
  });
});

describe("startMaintenanceScheduler", () => {
  let timer: NodeJS.Timeout;
  const readdirMock = readdir as unknown as jest.Mock;
  const errorMock = logger.error as unknown as jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (timer) {
      clearInterval(timer);
    }
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("runs maintenance scan immediately and on schedule", async () => {
    const runSpy = jest
      .spyOn(maintenanceScheduler, "runMaintenanceScan")
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    timer = startMaintenanceScheduler();

    await Promise.resolve();
    await Promise.resolve();

    expect(runSpy).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(24 * 60 * 60 * 1000);
    await Promise.resolve();
    await Promise.resolve();

    expect(runSpy).toHaveBeenCalledTimes(2);

    runSpy.mockRestore();
  });

  it("logs an error when runMaintenanceScan throws", async () => {
    readdirMock.mockRejectedValueOnce(new Error("fail"));

    timer = startMaintenanceScheduler();

    await Promise.resolve();
    await Promise.resolve();

    expect(errorMock).toHaveBeenCalledWith("maintenance scan failed", {
      err: expect.any(Error),
    });
  });

  it("continues scheduling after initial read error", async () => {
    readdirMock
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(["shop1"]);
    const inventory = readInventory as unknown as jest.Mock;
    inventory.mockResolvedValueOnce([]);
    const products = readProducts as unknown as jest.Mock;
    products.mockResolvedValueOnce([]);

    timer = startMaintenanceScheduler();

    await Promise.resolve();
    await Promise.resolve();

    jest.advanceTimersByTime(24 * 60 * 60 * 1000);
    await Promise.resolve();
    await Promise.resolve();

    expect(inventory).toHaveBeenCalledTimes(1);
  });
});
