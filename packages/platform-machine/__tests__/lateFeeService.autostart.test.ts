describe("auto-start", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, NODE_ENV: "production" } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("starts the service on import", async () => {
    const start = jest.fn().mockResolvedValue(undefined);
    const error = jest.fn();
    jest.doMock("../src/lateFeeService", () => {
      if (process.env.NODE_ENV !== "test") {
        start().catch((err: any) =>
          error("failed to start late fee service", { err })
        );
      }
      return { __esModule: true, startLateFeeService: start };
    });

    await import("../src/lateFeeService");

    expect(start).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
  });

});
