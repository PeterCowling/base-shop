import { jest } from "@jest/globals";

const checkAndAlert = jest.fn().mockResolvedValue([]);

jest.mock("../stockAlert.server", () => ({
  checkAndAlert,
}));

describe("scheduleStockChecks", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it(
    "runs checkAndAlert on the specified interval",
    async () => {
      const getItems = jest.fn().mockResolvedValue([{ sku: "s" } as any]);
      const { scheduleStockChecks } = await import("../stockScheduler.server");

      scheduleStockChecks("shop", getItems, 1000);

      await jest.advanceTimersByTimeAsync(1000);
      expect(getItems).toHaveBeenCalledTimes(1);
      expect(checkAndAlert).toHaveBeenCalledWith("shop", [{ sku: "s" }]);

      await jest.advanceTimersByTimeAsync(1000);
      expect(getItems).toHaveBeenCalledTimes(2);
    },
    10_000,
  );

  it("logs errors from checkAndAlert", async () => {
    const err = new Error("boom");
    const getItems = jest.fn().mockResolvedValue([]);
    checkAndAlert.mockRejectedValueOnce(err);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const { scheduleStockChecks } = await import("../stockScheduler.server");

    scheduleStockChecks("shop", getItems, 1000);

    await jest.advanceTimersByTimeAsync(1000);
    expect(consoleError).toHaveBeenCalledWith(
      "Scheduled stock check failed",
      err,
    );
    consoleError.mockRestore();
  });

  it("continues scheduling after failures", async () => {
    const err = new Error("boom");
    const getItems = jest.fn().mockResolvedValue([]);
    checkAndAlert.mockRejectedValueOnce(err);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const { scheduleStockChecks } = await import("../stockScheduler.server");

    scheduleStockChecks("shop", getItems, 1000);

    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);
    expect(checkAndAlert).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledWith(
      "Scheduled stock check failed",
      err,
    );
    consoleError.mockRestore();
  });

  it("does not accumulate timers over long periods", async () => {
    const getItems = jest.fn().mockResolvedValue([]);
    const { scheduleStockChecks } = await import("../stockScheduler.server");

    scheduleStockChecks("shop", getItems, 60 * 60 * 1000); // hourly

    for (let i = 1; i <= 24; i++) {
      await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
      expect(getItems).toHaveBeenCalledTimes(i);
      expect(checkAndAlert).toHaveBeenCalledTimes(i);
      expect(jest.getTimerCount()).toBe(1);
    }
  });

  it("tracks last run and history", async () => {
    const getItems = jest.fn().mockResolvedValue([]);
    const { scheduleStockChecks, getStockCheckStatus } = await import(
      "../stockScheduler.server"
    );

    scheduleStockChecks("shop", getItems, 1000);
    await jest.advanceTimersByTimeAsync(1000);

    const status = getStockCheckStatus("shop");
    expect(status?.intervalMs).toBe(1000);
    expect(status?.lastRun).toBeDefined();
    expect(status?.history).toHaveLength(1);
    expect(status?.history[0].alerts).toBe(0);
  });
});

