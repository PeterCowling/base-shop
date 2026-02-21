import { jest } from "@jest/globals";

const checkAndAlert = (jest.fn() as any).mockResolvedValue([]);
jest.mock("../src/services/stockAlert.server", () => ({
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

  it("passes fetched items to checkAndAlert", async () => {
    const mockGetItems = (jest.fn() as any).mockResolvedValue([{ sku: "s" } as any]);
    const { scheduleStockChecks } = await import("../src/services/stockScheduler.server");

    scheduleStockChecks("shop", mockGetItems as any, 100);

    await (jest as any).advanceTimersByTimeAsync(100);

    expect(mockGetItems).toHaveBeenCalledTimes(1);
    expect(checkAndAlert).toHaveBeenCalledWith("shop", [{ sku: "s" }]);
  });

  it("logs when getItems rejects", async () => {
    const mockGetItems = (jest.fn() as any).mockRejectedValueOnce(new Error("fail"));
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const { scheduleStockChecks } = await import("../src/services/stockScheduler.server");

    scheduleStockChecks("shop", mockGetItems as any, 100);

    await (jest as any).advanceTimersByTimeAsync(100);

    expect(consoleError).toHaveBeenCalledWith(
      "Scheduled stock check failed",
      expect.any(Error),
    );

    consoleError.mockRestore();
  });

  it("exposes status information", async () => {
    const mockGetItems = (jest.fn() as any).mockResolvedValue([]);
    const { scheduleStockChecks, getStockCheckStatus } = await import(
      "../src/services/stockScheduler.server"
    );

    scheduleStockChecks("shop", mockGetItems as any, 100);
    await (jest as any).advanceTimersByTimeAsync(100);

    const status = getStockCheckStatus("shop");
    expect(status?.intervalMs).toBe(100);
    expect(status?.history).toHaveLength(1);
  });
});

