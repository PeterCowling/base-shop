import { jest } from "@jest/globals";

jest.mock("@acme/platform-core/services/stockScheduler.server", () => ({
  scheduleStockChecks: jest.fn(),
  getStockCheckStatus: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/inventory.server", () => ({
  readInventory: jest.fn(),
}));

import {
  scheduleStockChecks,
  getStockCheckStatus,
} from "@acme/platform-core/services/stockScheduler.server";
import { readInventory } from "@acme/platform-core/repositories/inventory.server";
import {
  updateStockScheduler,
  getSchedulerStatus,
} from "../stockScheduler.server";

describe("stockScheduler actions", () => {
  const shop = "shop-id";
  const scheduleStockChecksMock =
    scheduleStockChecks as jest.MockedFunction<typeof scheduleStockChecks>;
  const getStockCheckStatusMock =
    getStockCheckStatus as jest.MockedFunction<typeof getStockCheckStatus>;
  const readInventoryMock = readInventory as jest.MockedFunction<typeof readInventory>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateStockScheduler", () => {
    it.each([
      { label: "missing interval", value: undefined },
      { label: "empty interval", value: "" },
      { label: "zero interval", value: "0" },
      { label: "negative interval", value: "-5" },
    ])("ignores %s", async ({ value }) => {
      const formData = new FormData();
      if (value !== undefined) {
        formData.set("intervalMs", value);
      }

      await updateStockScheduler(shop, formData);

      expect(scheduleStockChecksMock).not.toHaveBeenCalled();
    });

    it("schedules checks with a fetcher when interval is valid", async () => {
      const formData = new FormData();
      formData.set("intervalMs", "5000");
      const inventory = [{ id: "1" }] as unknown as Awaited<ReturnType<typeof readInventory>>;
      readInventoryMock.mockResolvedValue(inventory);

      await updateStockScheduler(shop, formData);

      expect(scheduleStockChecksMock).toHaveBeenCalledTimes(1);
      const [passedShop, fetchInventory, interval] =
        scheduleStockChecksMock.mock.calls[0];

      expect(passedShop).toBe(shop);
      expect(typeof fetchInventory).toBe("function");
      expect(interval).toBe(5000);

      await expect(fetchInventory()).resolves.toBe(inventory);
      expect(readInventoryMock).toHaveBeenCalledWith(shop);
    });
  });

  describe("getSchedulerStatus", () => {
    it("returns the scheduler status from the service", async () => {
      const status = {
        intervalMs: 1000,
        lastRun: Date.now(),
        history: [],
      } as Awaited<ReturnType<typeof getSchedulerStatus>>;
      getStockCheckStatusMock.mockReturnValue(status);

      await expect(getSchedulerStatus(shop)).resolves.toBe(status);
      expect(getStockCheckStatusMock).toHaveBeenCalledWith(shop);
    });
  });
});
