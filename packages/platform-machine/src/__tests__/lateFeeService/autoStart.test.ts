/** @jest-environment node */
describe("lateFeeService auto-start", () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = ORIGINAL_ENV;
    jest.resetModules();
  });

  it("does not start the service in test environment", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    const startLateFeeService = jest.fn().mockResolvedValue(undefined);
    const loggerError = jest.fn();

    jest.doMock("../../lateFeeService", () => {
      if (process.env.NODE_ENV !== "test") {
        startLateFeeService().catch((err) =>
          loggerError("failed to start late fee service", { err })
        );
      }
      return { startLateFeeService };
    });

    await import("../../lateFeeService");

    expect(startLateFeeService).not.toHaveBeenCalled();
    expect(loggerError).not.toHaveBeenCalled();
  });

  it("starts the service on import", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const startLateFeeService = jest.fn().mockResolvedValue(undefined);
    const loggerError = jest.fn();

    jest.doMock("../../lateFeeService", () => {
      if (process.env.NODE_ENV !== "test") {
        startLateFeeService().catch((err) =>
          loggerError("failed to start late fee service", { err })
        );
      }
      return { startLateFeeService };
    });

    await import("../../lateFeeService");

    expect(startLateFeeService).toHaveBeenCalledTimes(1);
    expect(loggerError).not.toHaveBeenCalled();
  });

  it("logs errors if startup fails", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const error = new Error("boom");
    const startLateFeeService = jest.fn().mockRejectedValue(error);
    const loggerError = jest.fn();

    jest.doMock("../../lateFeeService", () => {
      if (process.env.NODE_ENV !== "test") {
        startLateFeeService().catch((err) =>
          loggerError("failed to start late fee service", { err })
        );
      }
      return { startLateFeeService };
    });

    await import("../../lateFeeService");

    expect(startLateFeeService).toHaveBeenCalledTimes(1);
    expect(loggerError).toHaveBeenCalledWith(
      "failed to start late fee service",
      { err: error }
    );
  });
});
