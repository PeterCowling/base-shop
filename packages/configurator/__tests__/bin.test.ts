const spawnSyncMock = jest.fn();

jest.mock("node:child_process", () => ({
  spawnSync: (...args) => spawnSyncMock(...args),
}));

describe("configurator bin", () => {
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    spawnSyncMock.mockReset();
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
    await import("../bin/configurator.js");
    expect(spawnSyncMock).toHaveBeenCalledWith("vite", ["dev"], {
      stdio: "inherit",
      shell: true,
    });
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("exits cleanly when dist index resolves", async () => {
    jest.mock("../dist/index.js", () => ({}), { virtual: true });
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await import("../bin/configurator.js");

    expect(process.exitCode).toBeUndefined();
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

