import { jest } from "@jest/globals";

const checkAndAlert = jest.fn();

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

  it("runs checkAndAlert on the specified interval", async () => {
    const getItems = jest.fn().mockResolvedValue([{ sku: "s" } as any]);
    const { scheduleStockChecks } = await import("../stockScheduler.server");

    scheduleStockChecks("shop", getItems, 1000);

    await jest.advanceTimersByTimeAsync(1000);
    expect(getItems).toHaveBeenCalledTimes(1);
    expect(checkAndAlert).toHaveBeenCalledWith("shop", [{ sku: "s" }]);

    await jest.advanceTimersByTimeAsync(1000);
    expect(getItems).toHaveBeenCalledTimes(2);
  });

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
});

