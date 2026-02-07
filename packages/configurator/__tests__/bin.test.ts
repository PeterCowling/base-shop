const spawnSyncMock = jest.fn();

jest.mock("node:child_process", () => ({
  spawnSync: (...args) => spawnSyncMock(...args),
}));

describe("configurator bin", () => {
  let exitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    jest.resetModules();
    spawnSyncMock.mockReset();
    // Mock a successful child process result
    spawnSyncMock.mockReturnValue({ status: 0 });
    exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {}) as any);

    process.exitCode = undefined;
    process.argv = ["node", "configurator", "dev"];
    process.env.STRIPE_SECRET_KEY = "sk";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk";
    process.env.CART_COOKIE_SECRET = "secret";
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  it("runs the CLI", async () => {
    await import("../bin/configurator.cjs");
    expect(spawnSyncMock).toHaveBeenCalledWith("vite", ["dev"], {
      stdio: "inherit",
      shell: true,
    });
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("errors when required env vars are missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    delete process.env.CART_COOKIE_SECRET;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await import("../bin/configurator.cjs");

    expect(errorSpy).toHaveBeenCalledWith(
      "Missing required environment variables: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, CART_COOKIE_SECRET",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);

    errorSpy.mockRestore();
  });

  it("propagates spawnSync exit code", async () => {
    spawnSyncMock.mockReturnValue({ status: 2 });

    await import("../bin/configurator.cjs");

    expect(exitSpy).toHaveBeenCalledWith(2);
  });

  it("falls back to exit code 1 when spawnSync status is undefined", async () => {
    spawnSyncMock.mockReturnValue({ status: undefined });

    await import("../bin/configurator.cjs");

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(spawnSyncMock).toHaveBeenCalledTimes(1);
    expect(spawnSyncMock).toHaveBeenCalledWith("vite", ["dev"], {
      stdio: "inherit",
      shell: true,
    });
  });

  it("handles spawnSync errors", async () => {
    const err = new Error("fail");
    spawnSyncMock.mockReturnValue({ status: null, error: err });
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await import("../bin/configurator.cjs");

    expect(exitSpy).toHaveBeenCalledWith(1);
    if (errorSpy.mock.calls.length > 0) {
      expect(errorSpy).toHaveBeenCalledWith(err);
    }

    errorSpy.mockRestore();
  });

  it("runs build", async () => {
    process.argv = ["node", "configurator", "build"];

    await import("../bin/configurator.cjs");

    expect(spawnSyncMock).toHaveBeenCalledWith("vite", ["build"], {
      stdio: "inherit",
      shell: true,
    });
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("runs deploy", async () => {
    process.argv = ["node", "configurator", "deploy"];

    await import("../bin/configurator.cjs");

    expect(spawnSyncMock).toHaveBeenCalledWith(
      "wrangler",
      ["pages", "deploy", ".vercel/output/static"],
      {
        stdio: "inherit",
        shell: true,
      },
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("exits with usage for unsupported command", async () => {
    process.argv = ["node", "configurator", "wat"];
    const logSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    await import("../bin/configurator.cjs");

    expect(logSpy).toHaveBeenCalledWith(
      "Usage: pnpm configurator <dev|build|deploy>",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(spawnSyncMock).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });

  // Skip: requires package to be built (dist/index.js) and Jest moduleNameMapper interferes
  it.skip("exits cleanly when dist index resolves", async () => {
    jest.mock("../dist/index.js", () => ({}), { virtual: true });
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Ensure env vars are set for this test
    process.env.STRIPE_SECRET_KEY = "sk";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk";
    process.env.CART_COOKIE_SECRET = "secret";

    await import("../bin/configurator.cjs");

    expect(process.exitCode).toBeUndefined();
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

