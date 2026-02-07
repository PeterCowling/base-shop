/** @jest-environment node */

const startMaintenanceScheduler = jest.fn<NodeJS.Timeout, []>();
const runMaintenanceScan = jest.fn<Promise<void>, []>();
const loggerError = jest.fn();

jest.mock("@acme/platform-machine/maintenanceScheduler", () => ({
  startMaintenanceScheduler,
  runMaintenanceScan,
}));

jest.mock("@acme/platform-core/utils", () => ({
  logger: { error: loggerError },
}));

describe("updateMaintenanceSchedule", () => {
  let setIntervalSpy: jest.SpyInstance;
  let clearIntervalSpy: jest.SpyInstance;
  let handleCounter = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    handleCounter = 0;
    setIntervalSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(((
        _callback: (...args: unknown[]) => unknown,
        _ms?: number,
      ) => ({ id: ++handleCounter } as unknown as NodeJS.Timeout)) as unknown as typeof setInterval);
    clearIntervalSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it("ignores non-positive frequencies", async () => {
    await jest.isolateModulesAsync(async () => {
      const { updateMaintenanceSchedule } = await import("../maintenance.server");
      const values: Array<string | undefined> = [
        undefined,
        "0",
        "-5",
        "not-a-number",
      ];

      for (const value of values) {
        const form = new FormData();
        if (value !== undefined) {
          form.set("frequency", value);
        }

        await updateMaintenanceSchedule(form);
      }
    });

    expect(startMaintenanceScheduler).not.toHaveBeenCalled();
    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(clearIntervalSpy).not.toHaveBeenCalled();
  });

  it("starts scheduler and runs scans when frequency is positive", async () => {
    const initialHandle = { id: "initial" } as unknown as NodeJS.Timeout;
    startMaintenanceScheduler.mockReturnValue(initialHandle);
    runMaintenanceScan.mockResolvedValue(undefined);

    await jest.isolateModulesAsync(async () => {
      const { updateMaintenanceSchedule } = await import("../maintenance.server");
      const form = new FormData();
      form.set("frequency", "60000");
      await updateMaintenanceSchedule(form);
    });

    expect(startMaintenanceScheduler).toHaveBeenCalledTimes(1);
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    expect(clearIntervalSpy).toHaveBeenCalledWith(initialHandle);
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

    const run = setIntervalSpy.mock.calls[0][0] as () => Promise<void>;
    const intervalHandle = setIntervalSpy.mock.results[0]?.value as NodeJS.Timeout;

    expect(intervalHandle).toBeDefined();
    expect(runMaintenanceScan).not.toHaveBeenCalled();
    await expect(run()).resolves.toBeUndefined();
    expect(runMaintenanceScan).toHaveBeenCalledTimes(1);
  });

  it("logs errors when maintenance scans reject", async () => {
    const initialHandle = { id: "initial" } as unknown as NodeJS.Timeout;
    const failure = new Error("boom");
    startMaintenanceScheduler.mockReturnValue(initialHandle);
    runMaintenanceScan.mockRejectedValue(failure);

    await jest.isolateModulesAsync(async () => {
      const { updateMaintenanceSchedule } = await import("../maintenance.server");
      const form = new FormData();
      form.set("frequency", "15000");
      await updateMaintenanceSchedule(form);
    });

    const run = setIntervalSpy.mock.calls[0][0] as () => Promise<void>;
    await expect(run()).resolves.toBeUndefined();

    expect(loggerError).toHaveBeenCalledWith("maintenance scan failed", {
      err: failure,
    });
    expect(runMaintenanceScan).toHaveBeenCalledTimes(1);
  });

  it("clears the previous interval before scheduling a new one", async () => {
    const initialOne = { id: "initial-1" } as unknown as NodeJS.Timeout;
    const initialTwo = { id: "initial-2" } as unknown as NodeJS.Timeout;
    startMaintenanceScheduler
      .mockReturnValueOnce(initialOne)
      .mockReturnValueOnce(initialTwo);
    runMaintenanceScan.mockResolvedValue(undefined);

    await jest.isolateModulesAsync(async () => {
      const { updateMaintenanceSchedule } = await import("../maintenance.server");
      const first = new FormData();
      first.set("frequency", "1000");
      await updateMaintenanceSchedule(first);

      const second = new FormData();
      second.set("frequency", "2000");
      await updateMaintenanceSchedule(second);
    });

    const firstIntervalHandle = setIntervalSpy.mock.results[0]?.value as NodeJS.Timeout;
    const secondIntervalHandle = setIntervalSpy.mock.results[1]?.value as NodeJS.Timeout;

    expect(startMaintenanceScheduler).toHaveBeenCalledTimes(2);
    expect(setIntervalSpy).toHaveBeenCalledTimes(2);
    expect(setIntervalSpy.mock.calls[0][1]).toBe(1000);
    expect(setIntervalSpy.mock.calls[1][1]).toBe(2000);

    expect(clearIntervalSpy).toHaveBeenCalledTimes(3);
    expect(clearIntervalSpy.mock.calls[0][0]).toBe(initialOne);
    expect(clearIntervalSpy.mock.calls[1][0]).toBe(firstIntervalHandle);
    expect(clearIntervalSpy.mock.calls[2][0]).toBe(initialTwo);

    const previousIntervalClearOrder = clearIntervalSpy.mock.invocationCallOrder[1];
    const secondSetIntervalOrder = setIntervalSpy.mock.invocationCallOrder[1];

    expect(previousIntervalClearOrder).toBeLessThan(secondSetIntervalOrder);
    expect(firstIntervalHandle).toBeDefined();
    expect(secondIntervalHandle).toBeDefined();
  });
});
